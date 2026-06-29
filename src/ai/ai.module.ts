import { Global, Module } from '@nestjs/common';
import { GeminiProvider } from './gemini.provider';
import { AI_PROVIDER } from './ai.provider';

@Global()
@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: GeminiProvider,
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}
