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

const RefinementSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const GenerateAsosInputSchema = z.object({
  documents: z
    .array(z.string())
    .optional()
    .describe(
      'An array of training documents, each as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  courseDescription: z.string().optional().describe('A detailed description of the course.'),
  context: z.string().optional().describe('Optional context for the ASOs, like target country or industry.'),
  refinements: z.array(RefinementSchema).optional().describe('User answers to clarification questions for refining ASOs.'),
  systemPrompt: z.string().optional().describe('Custom system prompt to guide the AI.'),
});
export type GenerateAsosInput = z.infer<typeof GenerateAsosInputSchema>;

const AsoGenerationSchema = z.object({
  aims: z.array(z.string()).describe('A list of aims for the training program.'),
  skills: z.array(z.string()).describe('A list of skills to be gained from the training program.'),
  outcomes: z.array(z.string()).describe('A list of outcomes expected from the training program.'),
  cpdHours: z
    .number()
    .describe(
      'The estimated Continuing Professional Development (CPD) hours for the course based on the provided material. This should be a single numerical value.'
    ),
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

const prompt = ai.definePrompt(
  {
    name: 'generateAsosPrompt',
    input: {schema: GenerateAsosInputSchema},
    output: {schema: AsoGenerationSchema},
    prompt: `You are an expert in creating Aims, Skills, and Outcomes (ASOs) for training programs. You are also skilled at estimating Continuing Professional Development (CPD) hours.

    Based on the provided information, generate tailored ASOs. Also, provide an estimate for the CPD hours. The CPD hours should be a single number representing the total estimated time for the course.

    {{#if documents}}
    Training Documents:
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

    {{#if refinements}}
    The user has provided the following answers to clarification questions. Use this information to refine the ASOs:
    {{#each refinements}}
    Question: {{this.question}}
    Answer: {{this.answer}}
    {{/each}}
    {{/if}}

    Output the ASOs in a structured format, divided into Aims, Skills, and Outcomes. Include the estimated CPD hours as a numerical value.
    `,
  },
  {
    // Allow the system prompt to be overridden by the user.
    customizer: async (input) => {
      if (input.systemPrompt) {
        return {
          config: {
            system_instructions: input.systemPrompt,
          },
        };
      }
      return {};
    },
  }
);

const generateAsosFlow = ai.defineFlow(
  {
    name: 'generateAsosFlow',
    inputSchema: GenerateAsosInputSchema,
    outputSchema: GenerateAsosOutputSchema,
  },
  async input => {
    // If we are refining, we don't need to ask for more clarifications.
    if (input.refinements && input.refinements.length > 0) {
      const asosResult = await prompt(input);
      const asos = asosResult.output;
      if (!asos) {
        throw new Error('Failed to generate ASOs.');
      }
      return {
        ...asos,
        clarificationQuestions: [], // No new questions in refinement step
      };
    }

    // First step: Run ASO generation and ambiguity clarification in parallel
    const [asosResult, clarificationResult] = await Promise.all([
      prompt(input),
      clarifyAmbiguities({
        documents: input.documents,
        courseDescription: input.courseDescription,
        context: input.context,
      }),
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
