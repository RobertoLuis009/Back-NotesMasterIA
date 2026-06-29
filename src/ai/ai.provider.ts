export interface AiProvider {
  embed(text: string): Promise<number[]>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
