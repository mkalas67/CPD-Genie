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

const GenerateAsosInputSchema = z.object({
  documents: z
    .array(z.string())
    .describe(
      'An array of training documents, each as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  country: z.string().describe('The target country for the ASOs.'),
  industry: z.string().describe('The target industry for the ASOs.'),
});
export type GenerateAsosInput = z.infer<typeof GenerateAsosInputSchema>;

const GenerateAsosOutputSchema = z.object({
  aims: z.array(z.string()).describe('A list of aims for the training program.'),
  skills: z.array(z.string()).describe('A list of skills to be gained from the training program.'),
  outcomes: z
    .array(z.string())
    .describe('A list of outcomes expected from the training program.'),
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
  output: {schema: GenerateAsosOutputSchema},
  prompt: `You are an expert in creating Aims, Skills, and Outcomes (ASOs) for training programs.

  Based on the provided training documents, target country, and industry, generate tailored ASOs.
  If there are any ambiguities or gaps in the provided information, generate a list of clarifying questions.

  Training Documents:
  {{#each documents}}
  {{{media url=this}}}
  {{/each}}

  Target Country: {{{country}}}
  Target Industry: {{{industry}}}

  Output the ASOs in a structured format, divided into Aims, Skills, and Outcomes. If clarification is needed, use clarificationQuestions.
  `,
});

const generateAsosFlow = ai.defineFlow(
  {
    name: 'generateAsosFlow',
    inputSchema: GenerateAsosInputSchema,
    outputSchema: GenerateAsosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
