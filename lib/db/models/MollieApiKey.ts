import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMollieApiKey extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  label: string;
  encryptedKey: string;
  lastFourChars: string;
  isDefault: boolean;
  isValid: boolean;
  lastValidatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MollieApiKeySchema = new Schema<IMollieApiKey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    encryptedKey: {
      type: String,
      required: true,
    },
    lastFourChars: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    lastValidatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const MollieApiKey: Model<IMollieApiKey> =
  mongoose.models.MollieApiKey ||
  mongoose.model<IMollieApiKey>("MollieApiKey", MollieApiKeySchema);

export default MollieApiKey;
