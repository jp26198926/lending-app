import mongoose, { Schema, Document } from "mongoose";

// Status enum
export enum CycleStatus {
  ACTIVE = "Active",
  COMPLETED = "Completed",
  EXPIRED = "Expired",
  CANCELLED = "Cancelled",
}

// Cycle interface
export interface ICycle extends Document {
  loanId: mongoose.Types.ObjectId | string;
  cycleCount: number;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalDue: number;
  totalPaid: number;
  balance: number;
  profitExpected: number;
  profitEarned: number;
  profitRemaining: number;
  dateDue: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: CycleStatus;
}

// Cycle schema
const CycleSchema = new Schema<ICycle>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: [true, "Loan is required"],
    },
    cycleCount: {
      type: Number,
      required: [true, "Cycle count is required"],
      min: [1, "Cycle count must be at least 1"],
    },
    principal: {
      type: Number,
      required: [true, "Principal amount is required"],
      min: [0, "Principal must be a positive number"],
    },
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate must be a positive number"],
    },
    interestAmount: {
      type: Number,
      required: [true, "Interest amount is required"],
      min: [0, "Interest amount must be a positive number"],
    },
    totalDue: {
      type: Number,
      required: [true, "Total due is required"],
      min: [0, "Total due must be a positive number"],
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, "Total paid must be a positive number"],
    },
    balance: {
      type: Number,
      required: [true, "Balance is required"],
      min: [0, "Balance must be a positive number"],
    },
    profitExpected: {
      type: Number,
      required: [true, "Profit expected is required"],
      min: [0, "Profit expected must be a positive number"],
    },
    profitEarned: {
      type: Number,
      default: 0,
      min: [0, "Profit earned must be a positive number"],
    },
    profitRemaining: {
      type: Number,
      required: [true, "Profit remaining is required"],
      min: [0, "Profit remaining must be a positive number"],
    },
    dateDue: {
      type: Date,
      required: [true, "Due date is required"],
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
      enum: Object.values(CycleStatus),
      default: CycleStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
// Full unique index: Cycle counts are persistent and never reused (even after deletion)
// This ensures sequential cycle numbering per loan
CycleSchema.index({ loanId: 1, cycleCount: 1 }, { unique: true });
CycleSchema.index({ status: 1 });
CycleSchema.index({ loanId: 1, status: 1 });
CycleSchema.index({ dateDue: 1 });
CycleSchema.index({ createdAt: -1 });

// Export model
const Cycle =
  mongoose.models.Cycle || mongoose.model<ICycle>("Cycle", CycleSchema);
export default Cycle;
