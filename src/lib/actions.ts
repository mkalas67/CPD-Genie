'use server';

import { generateAsos } from '@/ai/flows/generate-asos';
import { z } from 'zod';
import type { GenerateAsosOutput } from '@/ai/flows/generate-asos';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const fileSchema = z
  .instanceof(File)
  .refine(file => file.size > 0, 'File cannot be empty.')
  .refine(file => file.size <= MAX_FILE_SIZE, `File size must be less than 5MB.`)
  .refine(file => ALLOWED_FILE_TYPES.includes(file.type), 'Invalid file type.');

const formSchema = z.object({
  country: z.string().min(1, 'Country is required.'),
  industry: z.string().min(1, 'Industry is required.'),
  documents: z
    .array(fileSchema)
    .min(1, 'At least one document is required.')
    .max(5, 'You can upload a maximum of 5 documents.'),
});

type ActionState = {
  data?: GenerateAsosOutput;
  error?: string;
  input?: {
    country: string;
    industry: string;
    docCount: number;
  };
};

async function fileToDataURI(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:${file.type};base64,${base64}`;
}

export async function handleGenerateAsos(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const rawFormData = {
      country: formData.get('country') as string,
      industry: formData.get('industry') as string,
      documents: formData.getAll('documents') as File[],
    };

    const validatedFields = formSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => e.message).join(' ');
      return { error: errorMessages };
    }

    const { country, industry, documents } = validatedFields.data;

    const documentDataURIs = await Promise.all(
      documents.map(file => fileToDataURI(file))
    );

    const result = await generateAsos({
      documents: documentDataURIs,
      country,
      industry,
    });

    return {
      data: result,
      input: {
        country,
        industry,
        docCount: documents.length,
      },
    };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
