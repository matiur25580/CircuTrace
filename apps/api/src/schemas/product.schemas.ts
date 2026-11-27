import { z } from 'zod';

const validGtin = (value: string) => {
  if (!/^(?:[0-9]{8}|[0-9]{12,14})$/.test(value)) return false;
  const digits = value.split('').map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
};
const countryCode = z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()).optional().nullable();
const manufacturerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  registrationNumber: z.string().trim().max(100).optional().nullable(),
  countryCode,
}).strict();
const supplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  role: z.enum(['supplier', 'assembler', 'distributor']),
  countryCode,
  reference: z.string().trim().max(120).optional().nullable(),
}).strict();
const materialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  materialType: z.string().trim().min(1).max(80),
  massGrams: z.number().positive().max(1_000_000_000),
  recycledContentPercent: z.number().min(0).max(100).default(0),
  originCountry: countryCode,
}).strict();

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(''),
  metadataFields: z.array(z.object({
    key: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,39}$/),
    label: z.string().trim().min(1).max(80),
    type: z.enum(['text', 'number', 'boolean', 'date', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  }).strict()).max(30).refine((fields) => new Set(fields.map((field) => field.key)).size === fields.length, 'Metadata field keys must be unique.').refine((fields) => fields.every((field) => field.type !== 'select' || field.options.length > 0), 'Select metadata fields must define at least one option.').default([]),
}).strict();

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).default(''),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i),
  sku: z.string().trim().min(1).max(64).optional(),
  gtin: z.string().refine(validGtin, 'GTIN must contain a valid check digit.').optional(),
  manufacturer: manufacturerSchema,
  suppliers: z.array(supplierSchema).max(30).default([]),
  materials: z.array(materialSchema).max(50).default([]),
  customAttributes: z.record(z.unknown()).default({}),
}).strict();

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  sku: z.string().trim().min(1).max(64).optional().nullable(),
  gtin: z.string().refine(validGtin, 'GTIN must contain a valid check digit.').optional().nullable(),
  status: z.enum(['draft', 'active', 'discontinued', 'recalled']).optional(),
  manufacturer: manufacturerSchema.optional(),
  suppliers: z.array(supplierSchema).max(30).optional(),
  materials: z.array(materialSchema).max(50).optional(),
  customAttributes: z.record(z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.');

export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  status: z.enum(['draft', 'active', 'discontinued', 'recalled']).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'name', 'identifier', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).strict();
