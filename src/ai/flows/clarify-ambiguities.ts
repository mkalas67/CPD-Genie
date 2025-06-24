// clarify-ambiguities.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for clarifying ambiguities or gaps in user-provided information
 *  for ASO (Aims, Skills, Outcomes) generation. This ensures the generated ASOs are accurate and relevant.
 *
 * - clarifyAmbiguities - The main function to trigger the ambiguity clarification flow.
 * - ClarifyAmbiguitiesInput - The input type for the clarifyAmbiguities function.
 * - ClarifyAmbiguitiesOutput - The output type for the clarifyAmbiguities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const ClarifyAmbiguitiesInputSchema = z.object({
  documents: z.array(z.string()).describe('List of document content strings.'),
  context: z.string().describe('Context information including target country and industry for the ASOs.'),
});
export type ClarifyAmbiguitiesInput = z.infer<typeof ClarifyAmbiguitiesInputSchema>;

// Define the output schema
const ClarifyAmbiguitiesOutputSchema = z.object({
  questions: z.array(z.string()).describe('List of clarifying questions to ask the user.'),
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
  prompt: `You are an AI assistant designed to identify ambiguities or gaps in user-provided documents and context information for ASO (Aims, Skills, Outcomes) generation.

  Analyze the following documents and context information:

  Documents:{{#each documents}}{{{this}}}
{{/each}}

  Context: {{{context}}}

  Identify any areas where the information is unclear, incomplete, or contradictory. Generate a list of clarifying questions that would help to resolve these ambiguities and ensure the generated ASOs are accurate and relevant. Only include questions related to ambiguities that can reasonably be resolved by the user.

  Format the output as a JSON object with a "questions" field containing an array of strings representing the clarifying questions.

  If there are no ambiguities, the "questions" array should be empty.
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
