import { z } from 'zod';

const apiSchema = z.object({
  baseUrl: z.string().url(),
  timeoutMs: z.number().int().positive(),
  retries: z.number().int().min(0)
});

export const configSchema = z.object({
  name: z.string().min(1),
  api: apiSchema,
  credentials: z.record(z.string(), z.string()),
  headers: z.record(z.string(), z.string()),
  features: z.record(z.string(), z.boolean()),
  testData: z.record(z.string(), z.unknown())
});

export type AppConfig = z.infer<typeof configSchema>;
export type ApiConfig = z.infer<typeof apiSchema>;
