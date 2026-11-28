import { z } from 'zod';

export const passportSectionsSchema = z.object({
  identity: z.boolean().default(true),
  manufacturer: z.boolean().default(true),
  materials: z.boolean().default(false),
  lifecycle: z.boolean().default(true),
}).strict().refine((sections) => Object.values(sections).some(Boolean), {
  message: 'At least one public passport section must be enabled.',
});

export const publishPassportSchema = z.object({
  sections: passportSectionsSchema,
}).strict();

export const updatePassportSchema = z.object({
  sections: passportSectionsSchema,
}).strict();
