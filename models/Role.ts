import mongoose, { Schema, Model, Types } from "mongoose";

export enum RoleStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

export interface IRole {
  _id?: Types.ObjectId;
  role: string;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  deletedReason?: string | null;
  status: RoleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    role: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedReason: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(RoleStatus),
      default: RoleStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  },
);

// Add indexes for better query performance
RoleSchema.index({ status: 1, createdAt: -1 });
RoleSchema.index({ role: 1, status: 1 });

const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;
