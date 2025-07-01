'use server';

import { generateAsos } from '@/ai/flows/generate-asos';
import { z } from 'zod';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
];

const fileSchema = z
  .instanceof(File)
  .refine(file => file.size > 0, 'File cannot be empty.')
  .refine(file => file.size <= MAX_FILE_SIZE, `File size must be less than 5MB.`)
  .refine(
    file => ALLOWED_FILE_TYPES.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.pdf') || file.name.endsWith('.docx'),
    'Invalid file type. Please upload PDF, DOCX, TXT, or MD files.'
  );

const refinementSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
  
const formSchema = z.object({
  context: z.string().optional(),
  documents: z
    .array(fileSchema)
    .max(5, 'You can upload a maximum of 5 documents.')
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
      path: ['documents'], // Assign error to a field for display
    }
  );

type ActionState = {
  data?: GenerateAsosOutput;
  error?: string;
  input?: {
    context?: string;
    docCount: number;
  };
};

async function fileToDataURI(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const type = file.type || 'application/octet-stream';
  return `data:${type};base64,${base64}`;
}

export async function handleGenerateAsos(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const headersList = headers();
    const ip = (headersList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    
    // Filter out empty file inputs from the form
    const documents = (formData.getAll('documents') as File[]).filter(f => f.size > 0);
    const context = formData.get('context') as string;
    const courseDescription = formData.get('courseDescription') as string;

    const refinements: { question: string, answer: string }[] = [];
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
      context,
      documents: documents.length > 0 ? documents : undefined,
      courseDescription,
      refinements: refinements.length > 0 ? refinements : undefined,
    });

    if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} Error: ${e.message}`).join(' ');
      return { error: errorMessages };
    }

    const { context: validatedContext, documents: validatedDocuments, courseDescription: validatedCourseDescription, refinements: validatedRefinements } = validatedFields.data;

    const documentDataURIs = validatedDocuments 
      ? await Promise.all(validatedDocuments.map(file => fileToDataURI(file)))
      : undefined;

    const result = await generateAsos({
      documents: documentDataURIs,
      courseDescription: validatedCourseDescription,
      context: validatedContext,
      refinements: validatedRefinements,
    });

    // Save to Firestore on successful generation without refinements
    if (result.aims.length > 0 && (!validatedRefinements || validatedRefinements.length === 0)) {
        await addDoc(collection(db, 'generations'), {
            aims: result.aims,
            skills: result.skills,
            outcomes: result.outcomes,
            context: validatedContext || '',
            docCount: validatedDocuments?.length || 0,
            description: validatedCourseDescription || '',
            createdAt: serverTimestamp(),
            ip: ip,
        });
        revalidatePath('/'); // Revalidate the page to show the new history item
    }

    return {
      data: result,
      input: {
        context: validatedContext,
        docCount: validatedDocuments?.length || 0,
      },
    };
  } catch (e: any) {
    console.error(e);
    // This is a specific check for a known issue with pdf-parse and Next.js/Webpack
    if (e.message?.includes("ENOENT: no such file or directory, open './test/data/05-versions-space.pdf'")) {
      return { error: 'There was an issue processing a PDF file. Please try re-saving the PDF or using a different file.'}
    }
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
