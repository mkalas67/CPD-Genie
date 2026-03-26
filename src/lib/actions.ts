'use server';

import { generateAsos } from '@/ai/flows/generate-asos';
import { SUPPORTED_MODELS, DEFAULT_MODEL } from '@/ai/models';
import { z } from 'zod';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import type { SupportedModel } from '@/ai/models';
import { headers } from 'next/headers';

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

const fileSchema = z
  .instanceof(File)
  .refine(file => file.size > 0, 'File cannot be empty.')
  .refine(file => file.size <= MAX_UPLOAD_SIZE, `File size must be less than 25MB.`)
  .refine(
    file => ALLOWED_FILE_TYPES.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.pdf') || file.name.endsWith('.docx'),
    'Invalid file type. Please upload PDF, DOCX, TXT, or MD files.'
  );

const refinementSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const formSchema = z.object({
  country: z.string().optional(),
  industry: z.string().optional(),
  documents: z
    .array(fileSchema)
    .max(5, 'You can upload a maximum of 5 documents.')
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        return totalSize <= MAX_UPLOAD_SIZE;
      },
      `Total file size for all documents must not exceed 25MB.`
    )
    .optional(),
  courseDescription: z
    .string()
    .max(5000, 'Course description cannot exceed 5000 characters.')
    .optional(),
  refinements: z.array(refinementSchema).optional(),
}).refine(
  (data) => (data.documents && data.documents.length > 0) || !!data.courseDescription,
  {
    message: 'Either course material or a description must be provided.',
    path: ['documents'],
  }
);

export type ActionState = {
  data?: GenerateAsosOutput;
  error?: string;
  input?: {
    country?: string;
    industry?: string;
    docCount: number;
    promptFile?: string;
    courseDescription?: string;
    model?: SupportedModel;
  };
};

async function fileToDataURI(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const type = file.type || 'application/octet-stream';
  return `data:${type};base64,${base64}`;
}

function buildOutput(result: GenerateAsosOutput): string {
  const sections: string[] = [];
  if (result.aims?.length)     sections.push('AIMS:\n' + result.aims.join('\n'));
  if (result.skills?.length)   sections.push('SKILLS:\n' + result.skills.join('\n'));
  if (result.outcomes?.length) sections.push('OUTCOMES:\n' + result.outcomes.join('\n'));
  return sections.join('\n\n');
}

// Derives the request country from CDN/proxy headers.
// Falls back to 'unknown' if no header is present (common on Firebase App Hosting
// without a CDN in front). Country-level data is not personal data under UK GDPR
// and is preferable to storing raw IP addresses.
function getUserCountry(headersList: Awaited<ReturnType<typeof headers>>): string {
  return (
    headersList.get('cf-ipcountry') ??       // Cloudflare
    headersList.get('x-vercel-ip-country') ?? // Vercel
    headersList.get('x-country-code') ??      // Generic CDN
    headersList.get('x-appengine-country') ?? // Google App Engine
    'unknown'
  );
}

async function sendToSheets(payload: Record<string, string>): Promise<void> {
  const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!sheetsWebhookUrl) return;
  try {
    await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error sending data to Google Sheet:', error);
  }
}

export async function handleGenerateAsos(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const headersList = await headers();
    const userCountry = getUserCountry(headersList);

    // Filter out empty file inputs from the form
    const documents = (formData.getAll('documents') as File[]).filter(f => f.size > 0);
    const promptFile = documents[0]?.name ?? '';

    const country = formData.get('country') as string | null;
    const industry = formData.get('industry') as string | null;
    const courseDescription = formData.get('courseDescription') as string | null;
    const rawModel = formData.get('model') as string | null;
    const model: SupportedModel = (SUPPORTED_MODELS as readonly string[]).includes(rawModel ?? '')
      ? (rawModel as SupportedModel)
      : DEFAULT_MODEL;

    const refinements: { question: string; answer: string }[] = [];

    // Handle framework question separately
    if (formData.has('question_framework')) {
      const question = formData.get('question_framework') as string;
      const answer = formData.get('answer_framework') as string;
      if (answer?.trim()) {
        refinements.push({ question, answer: answer.trim() });
      }
    }

    let i = 0;
    while (formData.has(`question_${i}`)) {
      const question = formData.get(`question_${i}`) as string;
      const answer = formData.get(`answer_${i}`) as string;
      if (answer?.trim()) {
        refinements.push({ question, answer: answer.trim() });
      }
      i++;
    }

    const validatedFields = formSchema.safeParse({
      country: country ?? undefined,
      industry: industry ?? undefined,
      documents: documents.length > 0 ? documents : undefined,
      courseDescription: courseDescription ?? undefined,
      refinements: refinements.length > 0 ? refinements : undefined,
    });

    if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} Error: ${e.message}`).join(' ');
      return { error: errorMessages };
    }

    const {
      country: validatedCountry,
      industry: validatedIndustry,
      documents: validatedDocuments,
      courseDescription: validatedCourseDescription,
      refinements: validatedRefinements,
    } = validatedFields.data;

    // Build a context string for the AI from the structured country + industry fields
    const contextParts = [validatedCountry, validatedIndustry].filter(Boolean);
    const aiContext = contextParts.length > 0 ? contextParts.join(' – ') : undefined;

    const documentDataURIs = validatedDocuments
      ? await Promise.all(validatedDocuments.map(file => fileToDataURI(file)))
      : undefined;

    const result = await generateAsos({
      documents: documentDataURIs,
      courseDescription: validatedCourseDescription,
      context: aiContext,
      refinements: validatedRefinements,
      model,
    });

    const isRefinement = validatedRefinements && validatedRefinements.length > 0;

    // Write to Google Sheet for every successful, actionable generation
    if (result.isActionable && result.aims && result.aims.length > 0) {
      await sendToSheets({
        timestamp:          new Date().toISOString(),
        country:            validatedCountry ?? '',
        industry:           validatedIndustry ?? '',
        promptText:         validatedCourseDescription ?? '',
        promptFile:         promptFile,
        output:             buildOutput(result),
        cpdEstimate:        result.cpdEstimate ?? '',
        suggestedFrameworks: result.suggestedFrameworks?.join(', ') ?? '',
        // Initial row: record questions asked. Refinement row: record answers given.
        questionsAsked:     isRefinement ? '' : (result.clarificationQuestions?.join(' | ') ?? ''),
        answersGiven:       isRefinement
                              ? validatedRefinements.map(r => `Q: ${r.question} A: ${r.answer}`).join(' | ')
                              : '',
        model:              model,
        userCountry:        userCountry,
      });
    }

    return {
      data: result,
      input: {
        country: validatedCountry,
        industry: validatedIndustry,
        docCount: validatedDocuments?.length || 0,
        promptFile,
        courseDescription: validatedCourseDescription,
        model,
      },
    };
  } catch (e: any) {
    console.error(e);
    // Specific check for a known issue with pdf-parse and Next.js/Webpack
    if (e.message?.includes('invalid-argument') && e.message?.includes('base64')) {
      return { error: 'There was an issue processing a file. It may be corrupted or in an unsupported format. Please try re-saving the file or using a different one.' };
    }
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
