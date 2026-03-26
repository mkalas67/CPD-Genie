export const SUPPORTED_MODELS = ['gemini-2.5-flash', 'claude-sonnet', 'gpt-4o'] as const;
export type SupportedModel = typeof SUPPORTED_MODELS[number];
export const DEFAULT_MODEL: SupportedModel = 'gemini-2.5-flash';
