import mongoose, { Schema, Model, Types } from "mongoose";

export enum PageStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

export interface IPage {
  _id?: Types.ObjectId;
  page: string;
  path: string;
  parentId?: Types.ObjectId | null;
  order: number;
  status: PageStatus;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  deletedReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const PageSchema = new Schema<IPage>(
  {
    page: {
      type: String,
      required: [true, "Page name is required"],
      trim: true,
      unique: true,
    },
    path: {
      type: String,
      required: [true, "Path is required"],
      trim: true,
      unique: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Page",
      default: null,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PageStatus),
      default: PageStatus.ACTIVE,
      required: true,
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
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  },
);

// Add index for better query performance
PageSchema.index({ parentId: 1, order: 1 });
PageSchema.index({ status: 1 });

const Page: Model<IPage> =
  mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);

export default Page;
