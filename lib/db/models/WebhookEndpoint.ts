import mongoose, { Document, Model, Schema } from "mongoose";

export type WebhookEndpointType = "classic" | "nextgen";

export interface IWebhookEndpoint extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: WebhookEndpointType;
  isEnabled: boolean;
  mollieApiKeyId?: mongoose.Types.ObjectId;
  resourceTypeFilter?: string[];
  sharedSecret?: string;
  eventTypeFilter?: string[];
  forwardingEnabled?: boolean;
  forwardingUrl?: string;
  forwardingHeaders?: Record<string, string>;
  forwardingTimeout?: number;
  retentionDays?: number;
  totalReceived: number;
  lastReceivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEndpointSchema = new Schema<IWebhookEndpoint>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["classic", "nextgen"],
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    // Classic webhook fields
    mollieApiKeyId: {
      type: Schema.Types.ObjectId,
      ref: "MollieApiKey",
    },
    resourceTypeFilter: [String],
    // Next-gen webhook fields
    sharedSecret: String,
    eventTypeFilter: [String],
    // Forwarding configuration
    forwardingEnabled: {
      type: Boolean,
      default: false,
    },
    forwardingUrl: String,
    forwardingHeaders: {
      type: Map,
      of: String,
    },
    forwardingTimeout: {
      type: Number,
      default: 30000,
    },
    // Common fields
    retentionDays: Number,
    totalReceived: {
      type: Number,
      default: 0,
    },
    lastReceivedAt: Date,
  },
  {
    timestamps: true,
  }
);

const WebhookEndpoint: Model<IWebhookEndpoint> =
  mongoose.models.WebhookEndpoint ||
  mongoose.model<IWebhookEndpoint>("WebhookEndpoint", WebhookEndpointSchema);

export default WebhookEndpoint;
