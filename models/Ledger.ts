import mongoose, { Schema, Document } from "mongoose";

// Type enum
export enum LedgerType {
  CAPITAL_IN = "Capital In",
  LOAN_RELEASE = "Loan Release",
  REPAYMENT = "Repayment",
  EXPENSE = "Expense",
  WITHDRAWAL = "Withdrawal",
}

// Direction enum
export enum LedgerDirection {
  IN = "In",
  OUT = "Out",
}

// Status enum
export enum LedgerStatus {
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

// Ledger interface
export interface ILedger extends Document {
  date: Date;
  userId?: mongoose.Types.ObjectId | string;
  type: LedgerType;
  direction: LedgerDirection;
  amount: number;
  loanId?: mongoose.Types.ObjectId | string;
  cycleId?: mongoose.Types.ObjectId | string;
  paymentId?: mongoose.Types.ObjectId | string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: LedgerStatus;
}

// Ledger schema
const LedgerSchema = new Schema<ILedger>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    type: {
      type: String,
      enum: Object.values(LedgerType),
      required: [true, "Type is required"],
    },
    direction: {
      type: String,
      enum: Object.values(LedgerDirection),
      required: [true, "Direction is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: false,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "Cycle",
      required: false,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: false,
    },
    description: {
      type: String,
      required: false,
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
      enum: Object.values(LedgerStatus),
      default: LedgerStatus.COMPLETED,
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
LedgerSchema.index({ date: -1 });
LedgerSchema.index({ userId: 1 });
LedgerSchema.index({ type: 1 });
LedgerSchema.index({ direction: 1 });
LedgerSchema.index({ loanId: 1 });
LedgerSchema.index({ cycleId: 1 });
LedgerSchema.index({ paymentId: 1 });
LedgerSchema.index({ status: 1 });

export default mongoose.models.Ledger ||
  mongoose.model<ILedger>("Ledger", LedgerSchema);
