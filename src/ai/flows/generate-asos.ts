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
});
export type GenerateAsosInput = z.infer<typeof GenerateAsosInputSchema>;

const AsoGenerationSchema = z.object({
  isActionable: z.boolean().describe("Whether the provided content is sufficient and relevant for ASO generation."),
  preliminaryFeedback: z.string().optional().describe("Feedback or questions if the content is not actionable. This could be a request for more detail or a trigger warning/hint."),
  aims: z.array(z.string().max(250)).max(5).optional().describe('A list of aims for the training program. Max 5 items, 250 chars each.'),
  skills: z.array(z.string().max(250)).max(5).optional().describe('A list of skills to be gained. Max 5 items, 250 chars each.'),
  outcomes: z.array(z.string().max(250)).max(5).optional().describe('A list of outcomes. Max 5 items, 250 chars each. Must follow "Learners will be able to [action verb] [skill] to [result or application]" format.'),
  cpdEstimate: z.string().optional().describe("The estimated CPD points and hours, including a brief justification."),
  suggestedFrameworks: z.array(z.string()).max(2).optional().describe("A list of up to two suggested skills frameworks (e.g., SFIA, RQF, DigComp)."),
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
    prompt: `You are an expert in creating Aims, Skills, and Outcomes (ASOs) for training programs.

    Follow your system instructions to analyze the following information, generate tailored ASOs, and provide feedback.
    
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
    `,
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

    // Only return clarification questions if the input was actionable
    const questions = asos.isActionable ? clarificationResult.questions : [];

    return {
      ...asos,
      clarificationQuestions: questions,
    };
  }
);
