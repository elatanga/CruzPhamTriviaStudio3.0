
import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  points: z.number().min(0).max(10000),
  prompt: z.string().min(1).max(1000, "Prompt too long (max 1000 chars)"),
  answer: z.string().min(1).max(500, "Answer too long (max 500 chars)"),
  status: z.string(),
  type: z.enum(['text', 'image', 'audio']).optional(),
  mediaUrl: z.string().optional()
});

export const CategorySchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100, "Title too long (max 100 chars)"),
  fontSize: z.number().optional(),
  questions: z.array(QuestionSchema).max(20, "Too many questions per category (max 20)")
});

export const GameSettingsSchema = z.object({
  minPoints: z.number(),
  maxPoints: z.number(),
  step: z.number(),
  currencySymbol: z.string(),
  timerDuration: z.number().optional().default(30)
});

export const TemplateSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1).max(100, "Template name too long (max 100 chars)"),
  settings: GameSettingsSchema,
  categories: z.array(CategorySchema).max(12, "Too many categories (max 12)"),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  updatedBy: z.string().optional()
});

export const validateTemplate = (data: unknown) => {
  return TemplateSchema.parse(data);
};
