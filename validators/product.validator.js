import { z } from "zod";

export const createProductSchema = z.object({
  _id: z.string({ required_error: "ID is required" }),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .trim(),
  price: z
    .number({ required_error: "Price is required", invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than 0"),
  salePrice: z.number().positive().optional(),
  category: z.string({ required_error: "Category is required" }).trim(),
  image: z.string({ required_error: "Image URL is required" }).trim(),
  hoverImage: z.string().trim().optional(),
  description: z.string().trim().optional(),
  details: z
    .object({
      material: z.string().optional(),
      dimensions: z.string().optional(),
      capacity: z.string().optional(),
      care: z.string().optional(),
    })
    .optional(),
  inStock: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),

  category: z.string().optional(),

  search: z.string().optional(),

  minPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined))
    .pipe(z.number().min(0).optional()),

  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined))
    .pipe(z.number().min(0).optional()),
});
