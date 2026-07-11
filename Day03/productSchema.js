import {z} from "zod";

export const productSchema = z.object({
  seoTitle: z.string().describe("Seo title for product"),
  features: z.array(z.string()),
  keywords: z.array(z.string()),
  description: z.string().optional(),
});
