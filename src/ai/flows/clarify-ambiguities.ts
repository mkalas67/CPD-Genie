// clarify-ambiguities.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for asking targeted follow-up questions to clarify
 * missing information for ASO (Aims, Skills, Outcomes) generation.
 *
 * - clarifyAmbiguities - The main function to trigger the clarification flow.
 * - ClarifyAmbiguitiesInput - The input type for the clarifyAmbiguities function.
 * - ClarifyAmbiguitiesOutput - The output type for the clarifyAmbiguities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const ClarifyAmbiguitiesInputSchema = z.object({
  documents: z
    .array(z.string())
    .optional()
    .describe(
      'An array of training documents, each as a data URI. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  courseDescription: z.string().optional().describe('A detailed description of the course.'),
  context: z.string().optional().describe('Context information including target country and industry.'),
});
export type ClarifyAmbiguitiesInput = z.infer<typeof ClarifyAmbiguitiesInputSchema>;

// Define the output schema
const ClarifyAmbiguitiesOutputSchema = z.object({
  questions: z.array(z.string()).max(4).describe('List of clarifying questions to ask the user. Maximum of 4 questions.'),
});
export type ClarifyAmbiguitiesOutput = z.infer<typeof ClarifyAmbiguitiesOutputSchema>;

// Exported function to call the flow
export async function clarifyAmbiguities(input: ClarifyAmbiguitiesInput): Promise<ClarifyAmbiguitiesOutput> {
  return clarifyAmbiguitiesFlow(input);
}

// Define the prompt
const clarifyAmbiguitiesPrompt = ai.definePrompt({
  name: 'clarifyAmbiguitiesPrompt',
  input: {schema: ClarifyAmbiguitiesInputSchema},
  output: {schema: ClarifyAmbiguitiesOutputSchema},
  prompt: `You are an AI assistant designed to identify missing information in user-provided documents and context for ASO (Aims, Skills, Outcomes) generation.

  Analyze the following information:

  {{#if documents}}
  Documents:
  {{#each documents}}
  {{{media url=this}}}
  {{/each}}
  {{/if}}

  {{#if courseDescription}}
  Course Description:
  {{{courseDescription}}}
  {{/if}}

  {{#if context}}
  Context: {{{context}}}
  {{/if}}

  Based on the provided information, generate a list of targeted follow-up questions to gather missing data. Ask about the following topics if they are not already clear:
  - Does this course assume prior knowledge or qualifications?
  - Is there an assessment involved—written, practical, or tutor-observed?
  - Who is the target audience or profession this is aimed at?
  - Is the course focused on a specific industry or job role?

  Generate a maximum of 4 questions. If the information is already sufficient, the "questions" array should be empty.
  `,
});

// Define the flow
const clarifyAmbiguitiesFlow = ai.defineFlow(
  {
    name: 'clarifyAmbiguitiesFlow',
    inputSchema: ClarifyAmbiguitiesInputSchema,
    outputSchema: ClarifyAmbiguitiesOutputSchema,
  },
  async input => {
    const {output} = await clarifyAmbiguitiesPrompt(input);
    return output!;
  }
);
