import mongoose, { Schema, Model, Types } from "mongoose";

export enum RolePermissionStatus {
  INACTIVE = "INACTIVE",
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

export interface IRolePermission {
  _id?: Types.ObjectId;
  roleId: Types.ObjectId;
  pageId: Types.ObjectId;
  permissionId: Types.ObjectId;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  deletedReason?: string | null;
  status: RolePermissionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
    },
    pageId: {
      type: Schema.Types.ObjectId,
      ref: "Page",
      required: [true, "Page ID is required"],
    },
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      required: [true, "Permission ID is required"],
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
      enum: Object.values(RolePermissionStatus),
      default: RolePermissionStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  },
);

// Compound unique index to prevent duplicate role-page-permission assignments
RolePermissionSchema.index(
  { roleId: 1, pageId: 1, permissionId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: RolePermissionStatus.ACTIVE },
  },
);

// Additional indexes for better query performance
RolePermissionSchema.index({ roleId: 1, status: 1 });
RolePermissionSchema.index({ pageId: 1, status: 1 });
RolePermissionSchema.index({ permissionId: 1, status: 1 });
RolePermissionSchema.index({ status: 1, createdAt: -1 });

const RolePermission: Model<IRolePermission> =
  mongoose.models.RolePermission ||
  mongoose.model<IRolePermission>("RolePermission", RolePermissionSchema);

export default RolePermission;
