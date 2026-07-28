import { z } from 'zod';

const websiteSchema = z.string().trim().url('Invalid website URL').max(512).optional().nullable();

export const createProfileSchema = z.object({
  userId: z.coerce.number().int().min(1),
  companyName: z.string().trim().max(255).optional().nullable(),
  website: websiteSchema,
  sandboxEnabled: z.coerce.boolean().optional().default(true),
});

export const updateProfileSchema = z.object({
  companyName: z.string().trim().max(255).optional().nullable(),
  website: websiteSchema,
  sandboxEnabled: z.coerce.boolean().optional(),
});

export const createOAuthAppSchema = z.object({
  name: z.string().trim().min(1).max(128),
  redirectUris: z.array(z.string().trim().url()).max(20).optional().default([]),
  scopes: z.array(z.string().trim().min(1).max(64)).max(50).optional().default([]),
  environment: z.enum(['sandbox', 'production']).optional().default('sandbox'),
});

export const updateOAuthAppSchema = z.object({
  name: z.string().trim().min(1).max(128),
  redirectUris: z.array(z.string().trim().url()).max(20).optional().default([]),
  scopes: z.array(z.string().trim().min(1).max(64)).max(50).optional().default([]),
  environment: z.enum(['sandbox', 'production']).optional(),
});
