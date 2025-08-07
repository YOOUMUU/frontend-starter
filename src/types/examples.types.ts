import { z } from 'zod';

export const ExampleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, '名称不能为空'),
  description: z.string(),
  count: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Example = z.infer<typeof ExampleSchema>;

// CREATE 参数 - 排除系统生成的字段
export const CreateExampleSchema = ExampleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateExampleParams = z.infer<typeof CreateExampleSchema>;

// UPDATE 参数 - id 必需，其他字段可选，排除系统字段
export const UpdateExampleSchema = ExampleSchema.omit({
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .required({ id: true });

export type UpdateExampleParams = z.infer<typeof UpdateExampleSchema>;

// READ/GET 参数
export const GetExampleSchema = ExampleSchema.pick({ id: true });

export type GetExampleParams = z.infer<typeof GetExampleSchema>;

// LIST/SEARCH 参数
export const ListExampleSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['id', 'name', 'createdAt', 'updatedAt']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListExampleParams = z.infer<typeof ListExampleSchema>;

// DELETE 参数
export const DeleteExampleSchema = ExampleSchema.pick({ id: true });

export type DeleteExampleParams = z.infer<typeof DeleteExampleSchema>;
