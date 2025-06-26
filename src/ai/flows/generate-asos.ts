// src/ai/flows/generate-asos.ts
'use server';
/**
 * @fileOverview A flow to generate Aims, Skills, and Outcomes (ASOs) based on uploaded training documents and specified context.
 *
 * - generateAsos - A function that handles the ASO generation process.
 * - GenerateAsosInput - The input type for the generateAsos function.
 * - GenerateAsosOutput - The return type for the generateAsos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {clarifyAmbiguities} from './clarify-ambiguities';

const GenerateAsosInputSchema = z.object({
  documents: z
    .array(z.string())
    .describe(
      'An array of training documents, each as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  context: z.string().optional().describe('Optional context for the ASOs, like target country or industry.'),
});
export type GenerateAsosInput = z.infer<typeof GenerateAsosInputSchema>;

const AsoGenerationSchema = z.object({
  aims: z.array(z.string()).describe('A list of aims for the training program.'),
  skills: z.array(z.string()).describe('A list of skills to be gained from the training program.'),
  outcomes: z.array(z.string()).describe('A list of outcomes expected from the training program.'),
});

const GenerateAsosOutputSchema = AsoGenerationSchema.extend({
  clarificationQuestions: z
    .array(z.string())
    .optional()
    .describe('A list of questions to clarify ambiguities in the input.'),
});
export type GenerateAsosOutput = z.infer<typeof GenerateAsosOutputSchema>;

export async function generateAsos(input: GenerateAsosInput): Promise<GenerateAsosOutput> {
  return generateAsosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAsosPrompt',
  input: {schema: GenerateAsosInputSchema},
  output: {schema: AsoGenerationSchema},
  prompt: `You are an expert in creating Aims, Skills, and Outcomes (ASOs) for training programs.

  Based on the provided training documents and optional context, generate tailored ASOs.

  Training Documents:
  {{#each documents}}
  {{{media url=this}}}
  {{/each}}

  {{#if context}}
  Context: {{{context}}}
  {{/if}}

  Output the ASOs in a structured format, divided into Aims, Skills, and Outcomes.
  `,
});

const generateAsosFlow = ai.defineFlow(
  {
    name: 'generateAsosFlow',
    inputSchema: GenerateAsosInputSchema,
    outputSchema: GenerateAsosOutputSchema,
  },
  async input => {
    // Run ASO generation and ambiguity clarification in parallel
    const [asosResult, clarificationResult] = await Promise.all([
      prompt(input),
      clarifyAmbiguities(input),
    ]);

    const asos = asosResult.output;
    if (!asos) {
      throw new Error('Failed to generate ASOs.');
    }

    return {
      ...asos,
      clarificationQuestions: clarificationResult.questions,
    };
  }
);
