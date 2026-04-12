import mongoose, { Schema, Model, Types } from "mongoose";

export enum PermissionStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

export interface IPermission {
  _id?: Types.ObjectId;
  permission: string;
  status: PermissionStatus;
  deletedAt?: Date | null;
}

const PermissionSchema = new Schema<IPermission>(
  {
    permission: {
      type: String,
      required: [true, "Permission name is required"],
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(PermissionStatus),
      default: PermissionStatus.ACTIVE,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  },
);

// Add index for better query performance
PermissionSchema.index({ status: 1 });

const Permission: Model<IPermission> =
  mongoose.models.Permission ||
  mongoose.model<IPermission>("Permission", PermissionSchema);

export default Permission;
