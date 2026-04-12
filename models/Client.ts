import mongoose, { Schema, Document } from "mongoose";

// Status enum
export enum ClientStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

// Client interface
export interface IClient extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: ClientStatus;
}

// Client schema
const ClientSchema = new Schema<IClient>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      required: false,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
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
    deletedAt: {
      type: Date,
      required: false,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    deletedReason: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(ClientStatus),
      default: ClientStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
ClientSchema.index({ status: 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ email: 1, status: 1 });

// Export the model
export default mongoose.models.Client ||
  mongoose.model<IClient>("Client", ClientSchema);
