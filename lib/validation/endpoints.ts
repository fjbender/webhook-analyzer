import { z } from "zod";

// Mollie resource types for classic webhooks
export const resourceTypes = [
  "payment",
  "order",
  "refund",
  "subscription",
  "mandate",
  "customer",
  "invoice",
] as const;

// Mollie event types for next-gen webhooks
export const eventTypes = [
  "payment.created",
  "payment.paid",
  "payment.failed",
  "payment.expired",
  "payment.canceled",
  "order.created",
  "order.paid",
  "order.completed",
  "order.expired",
  "order.canceled",
  "refund.created",
  "refund.failed",
  "subscription.created",
  "subscription.activated",
  "subscription.canceled",
  "subscription.suspended",
  "subscription.resumed",
] as const;

// Base endpoint schema
const baseEndpointSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  retentionDays: z.number().int().min(1).max(365).optional(),
  forwardingEnabled: z.boolean().optional(),
  forwardingUrl: z.string().url("Invalid URL").optional(),
  forwardingHeaders: z.record(z.string()).optional(),
  forwardingTimeout: z.number().int().min(1000).max(60000).optional(),
});

// Classic webhook endpoint
export const classicEndpointSchema = baseEndpointSchema.extend({
  type: z.literal("classic"),
  mollieApiKeyId: z.string().min(1, "API key is required"),
  resourceTypeFilter: z.array(z.enum(resourceTypes)).optional(),
});

// Next-gen webhook endpoint
export const nextgenEndpointSchema = baseEndpointSchema.extend({
  type: z.literal("nextgen"),
  sharedSecret: z.string().min(1, "Shared secret is required"),
  eventTypeFilter: z.array(z.enum(eventTypes)).optional(),
});

// Combined schema for creation
export const createEndpointSchema = z.discriminatedUnion("type", [
  classicEndpointSchema,
  nextgenEndpointSchema,
]);

// Update schema (all fields optional except what's being updated)
export const updateEndpointSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isEnabled: z.boolean().optional(),
  mollieApiKeyId: z.string().optional(),
  resourceTypeFilter: z.array(z.enum(resourceTypes)).optional(),
  sharedSecret: z.string().optional(),
  eventTypeFilter: z.array(z.enum(eventTypes)).optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
  forwardingEnabled: z.boolean().optional(),
  forwardingUrl: z.string().url("Invalid URL").optional(),
  forwardingHeaders: z.record(z.string()).optional(),
  forwardingTimeout: z.number().int().min(1000).max(60000).optional(),
});

export type ClassicEndpointInput = z.infer<typeof classicEndpointSchema>;
export type NextgenEndpointInput = z.infer<typeof nextgenEndpointSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;
