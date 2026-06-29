import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiProvider } from './ai.provider';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.get<string>('GEMINI_API_KEY')!,
      httpOptions: { apiVersion: 'v1' },
    });
    this.model = config.get<string>('EMBEDDING_MODEL', 'text-embedding-004');
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: this.model,
      contents: text,
      config: { outputDimensionality: 768 },
    });
    return response.embeddings![0].values!;
  }
}
