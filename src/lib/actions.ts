'use server';

import { generateAsos } from '@/ai/flows/generate-asos';
import { z } from 'zod';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
    .min(1, 'At least one document is required.')
    .max(5, 'You can upload a maximum of 5 documents.'),
  refinements: z.array(refinementSchema).optional(),
});

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
    const documents = formData.getAll('documents') as File[];
    const context = formData.get('context') as string;

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
      documents,
      refinements: refinements.length > 0 ? refinements : undefined,
    });

    if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} Error: ${e.message}`).join(' ');
      return { error: errorMessages };
    }

    const { context: validatedContext, documents: validatedDocuments, refinements: validatedRefinements } = validatedFields.data;

    const documentDataURIs = await Promise.all(
      validatedDocuments.map(file => fileToDataURI(file))
    );

    const result = await generateAsos({
      documents: documentDataURIs,
      context: validatedContext,
      refinements: validatedRefinements,
    });

    return {
      data: result,
      input: {
        context: validatedContext,
        docCount: validatedDocuments.length,
      },
    };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
