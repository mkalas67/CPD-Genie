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
import { ASO_SYSTEM_PROMPT, ASO_USER_PROMPT_TEMPLATE } from '@/ai/prompts/aso-prompt';
import { SUPPORTED_MODELS, DEFAULT_MODEL } from '@/ai/models';
import type { SupportedModel } from '@/ai/models';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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
  model: z.enum(SUPPORTED_MODELS).optional().describe('The AI model to use for generation.'),
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

// Build a plain-text user message from input (for non-Genkit models that can't use Handlebars/media).
function buildUserMessage(input: GenerateAsosInput): string {
  const parts: string[] = ['Analyze the following information and generate tailored ASOs.'];

  if (input.courseDescription) {
    parts.push(`\nCourse Description:\n${input.courseDescription}`);
  }

  if (input.context) {
    parts.push(`\nContext: ${input.context}`);
  }

  if (input.refinements && input.refinements.length > 0) {
    parts.push('\nThe user has provided the following answers to clarification questions. Use this information to refine the ASOs:');
    for (const r of input.refinements) {
      parts.push(`Question: ${r.question}\nAnswer: ${r.answer}`);
    }
  }

  return parts.join('\n');
}

const JSON_SCHEMA_INSTRUCTIONS = `
Respond ONLY with a valid JSON object matching this schema (no markdown, no explanation):
{
  "isActionable": boolean,
  "preliminaryFeedback": string | undefined,
  "aims": string[] (max 5, max 250 chars each) | undefined,
  "skills": string[] (max 5, max 250 chars each) | undefined,
  "outcomes": string[] (max 5, max 250 chars each) | undefined,
  "cpdEstimate": string | undefined,
  "suggestedFrameworks": string[] (max 2) | undefined
}`;

async function runWithClaude(input: GenerateAsosInput): Promise<z.infer<typeof AsoGenerationSchema>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userMessage = buildUserMessage(input);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: ASO_SYSTEM_PROMPT + JSON_SCHEMA_INSTRUCTIONS,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);
  return AsoGenerationSchema.parse(parsed);
}

async function runWithOpenAI(input: GenerateAsosInput): Promise<z.infer<typeof AsoGenerationSchema>> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userMessage = buildUserMessage(input);

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ASO_SYSTEM_PROMPT + JSON_SCHEMA_INSTRUCTIONS },
      { role: 'user', content: userMessage },
    ],
  });

  const text = response.choices[0].message.content ?? '';
  const parsed = JSON.parse(text);
  return AsoGenerationSchema.parse(parsed);
}

// Genkit prompt (Gemini)
const genkitPrompt = ai.definePrompt(
  {
    name: 'generateAsosPrompt',
    input: {schema: GenerateAsosInputSchema},
    output: {schema: AsoGenerationSchema},
    system: ASO_SYSTEM_PROMPT,
    prompt: ASO_USER_PROMPT_TEMPLATE,
  }
);

const generateAsosFlow = ai.defineFlow(
  {
    name: 'generateAsosFlow',
    inputSchema: GenerateAsosInputSchema,
    outputSchema: GenerateAsosOutputSchema,
  },
  async input => {
    const model = input.model ?? DEFAULT_MODEL;

    // If we are refining, we don't need to ask for more clarifications.
    if (input.refinements && input.refinements.length > 0) {
      let asos: z.infer<typeof AsoGenerationSchema>;
      if (model === 'claude-sonnet') {
        asos = await runWithClaude(input);
      } else if (model === 'gpt-4o') {
        asos = await runWithOpenAI(input);
      } else {
        const result = await genkitPrompt(input);
        if (!result.output) throw new Error('Failed to generate ASOs.');
        asos = result.output;
      }
      return { ...asos, clarificationQuestions: [] };
    }

    // First step: run ASO generation and clarification in parallel.
    // Non-Gemini models don't support document media in the same way, so clarification
    // always runs via Gemini (it only uses text fields).
    const clarificationPromise = clarifyAmbiguities({
      documents: input.documents,
      courseDescription: input.courseDescription,
      context: input.context,
    });

    let asos: z.infer<typeof AsoGenerationSchema>;
    let clarificationResult: Awaited<ReturnType<typeof clarifyAmbiguities>>;

    if (model === 'claude-sonnet') {
      [asos, clarificationResult] = await Promise.all([runWithClaude(input), clarificationPromise]);
    } else if (model === 'gpt-4o') {
      [asos, clarificationResult] = await Promise.all([runWithOpenAI(input), clarificationPromise]);
    } else {
      const [asosResult, clarResult] = await Promise.all([genkitPrompt(input), clarificationPromise]);
      if (!asosResult.output) throw new Error('Failed to generate ASOs.');
      asos = asosResult.output;
      clarificationResult = clarResult;
    }

    const questions = asos.isActionable ? clarificationResult.questions : [];

    return { ...asos, clarificationQuestions: questions };
  }
);
