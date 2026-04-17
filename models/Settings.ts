import mongoose, { Schema, Document } from "mongoose";

// Settings interface
export interface ISettings extends Document {
  name: string;
  phone?: string;
  email?: string;
  cashOnHand: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
}

// Settings schema
const SettingsSchema = new Schema<ISettings>(
  {
    name: {
      type: String,
      required: [true, "Application name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    cashOnHand: {
      type: Number,
      required: [true, "Cash on hand is required"],
      default: 0,
      min: [0, "Cash on hand cannot be negative"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
SettingsSchema.index({ name: 1 });

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
