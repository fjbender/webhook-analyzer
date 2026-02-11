import { z } from "zod";

// Mollie API key format validation
// Test keys: test_xxx (30 chars after prefix)
// Live keys: live_xxx (30 chars after prefix)
export const mollieApiKeySchema = z.object({
  label: z.string().min(1, "Label is required").max(100, "Label too long"),
  apiKey: z
    .string()
    .min(1, "API key is required")
    .regex(/^(test|live)_[a-zA-Z0-9]{30}$/, "Invalid Mollie API key format"),
  isDefault: z.boolean().optional().default(false),
});

export const updateMollieApiKeySchema = z.object({
  label: z.string().min(1, "Label is required").max(100, "Label too long").optional(),
  isDefault: z.boolean().optional(),
});

export type MollieApiKeyInput = z.infer<typeof mollieApiKeySchema>;
export type UpdateMollieApiKeyInput = z.infer<typeof updateMollieApiKeySchema>;
