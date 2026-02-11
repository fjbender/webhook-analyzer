import mongoose, { Document, Model, Schema } from "mongoose";

export type WebhookStatus = "success" | "signature_failed" | "fetch_failed" | "invalid";

export interface IWebhookLog extends Document {
  _id: mongoose.Types.ObjectId;
  endpointId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  receivedAt: Date;
  processingTimeMs: number;
  requestHeaders: Record<string, string>;
  requestBody: any;
  rawBody?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  fetchedResource?: any;
  fetchError?: string;
  eventType?: string;
  signatureValid?: boolean;
  signatureHeader?: string;
  forwardedAt?: Date;
  forwardingUrl?: string;
  forwardingStatus?: number;
  forwardingError?: string;
  forwardingTimeMs?: number;
  isReplay?: boolean;
  originalLogId?: mongoose.Types.ObjectId;
  replayedAt?: Date;
  replayedBy?: mongoose.Types.ObjectId;
  status: WebhookStatus;
  createdAt: Date;
}

const WebhookLogSchema = new Schema<IWebhookLog>(
  {
    endpointId: {
      type: Schema.Types.ObjectId,
      ref: "WebhookEndpoint",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receivedAt: {
      type: Date,
      required: true,
      index: true,
    },
    processingTimeMs: {
      type: Number,
      required: true,
    },
    requestHeaders: {
      type: Map,
      of: String,
      required: true,
    },
    requestBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    rawBody: String,
    ipAddress: String,
    userAgent: String,
    resourceType: String,
    resourceId: String,
    fetchedResource: Schema.Types.Mixed,
    fetchError: String,
    eventType: String,
    signatureValid: Boolean,
    signatureHeader: String,
    // Forwarding details
    forwardedAt: Date,
    forwardingUrl: String,
    forwardingStatus: Number,
    forwardingError: String,
    forwardingTimeMs: Number,
    // Replay tracking
    isReplay: {
      type: Boolean,
      default: false,
    },
    originalLogId: {
      type: Schema.Types.ObjectId,
      ref: "WebhookLog",
    },
    replayedAt: Date,
    replayedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["success", "signature_failed", "fetch_failed", "invalid"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

WebhookLogSchema.index({ userId: 1, receivedAt: -1 });
WebhookLogSchema.index({ endpointId: 1, receivedAt: -1 });

const WebhookLog: Model<IWebhookLog> =
  mongoose.models.WebhookLog || mongoose.model<IWebhookLog>("WebhookLog", WebhookLogSchema);

export default WebhookLog;
