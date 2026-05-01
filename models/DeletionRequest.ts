import mongoose, { Schema, Document } from "mongoose";

export interface IDeletionRequest extends Document {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: mongoose.Types.ObjectId;
  reason: string;
  additionalInfo?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  processingNotes?: string;
}

const DeletionRequestSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reason: {
      type: String,
      required: true,
    },
    additionalInfo: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processingNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
DeletionRequestSchema.index({ email: 1, status: 1 });
DeletionRequestSchema.index({ userId: 1 });

export default mongoose.models.DeletionRequest ||
  mongoose.model<IDeletionRequest>("DeletionRequest", DeletionRequestSchema);
