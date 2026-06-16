import { celebrate, type CelebrateOptions, Segments } from 'celebrate'
import type { SchemaMap } from 'joi'

export const validateMiddleware = (
  schema: { body?: SchemaMap; query?: SchemaMap; params?: SchemaMap },
  options?: CelebrateOptions
) => {
  const celebrateSchema: Record<string, SchemaMap> = {}
  if (schema.body) celebrateSchema[Segments.BODY] = schema.body
  if (schema.query) celebrateSchema[Segments.QUERY] = schema.query
  if (schema.params) celebrateSchema[Segments.PARAMS] = schema.params

  return celebrate(celebrateSchema, {
    abortEarly: false,
    ...options
  })
}
