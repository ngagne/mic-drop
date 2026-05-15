import { z } from 'zod';

import { HTTP_METHODS } from '../constants';

const primitiveSchema = z.union([z.string(), z.number(), z.boolean()]);
const queryValueSchema = z.union([primitiveSchema, z.array(primitiveSchema)]);

export const requestDefinitionSchema = z.object({
  method: z.enum(HTTP_METHODS),
  path: z.string().min(1),
  baseUrl: z.string().url().optional(),
  pathParams: z.record(primitiveSchema).optional(),
  query: z.record(queryValueSchema).optional(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  timeoutMs: z.number().int().positive().optional()
});

export type RequestDefinition = z.infer<typeof requestDefinitionSchema>;
export type PrimitiveValue = z.infer<typeof primitiveSchema>;
export type QueryValue = z.infer<typeof queryValueSchema>;
