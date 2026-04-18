import mongoose, { Schema, Document } from "mongoose";

// Type enum
export enum UserLedgerType {
  CAPITAL_IN = "CAPITAL_IN",
  EARNING = "EARNING",
  WITHDRAWAL = "WITHDRAWAL",
}

// Status enum
export enum UserLedgerStatus {
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

// UserLedger interface
export interface IUserLedger extends Document {
  date: Date;
  amount: number;
  type: UserLedgerType;
  userId: mongoose.Types.ObjectId | string;
  loanId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: UserLedgerStatus;
}

// UserLedger schema
const UserLedgerSchema = new Schema<IUserLedger>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    type: {
      type: String,
      enum: Object.values(UserLedgerType),
      required: [true, "Type is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: false,
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
      enum: Object.values(UserLedgerStatus),
      default: UserLedgerStatus.COMPLETED,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
UserLedgerSchema.index({ userId: 1 });
UserLedgerSchema.index({ loanId: 1 });
UserLedgerSchema.index({ status: 1 });
UserLedgerSchema.index({ date: -1 });
UserLedgerSchema.index({ type: 1 });
UserLedgerSchema.index({ userId: 1, status: 1, date: -1 });

// Export the model
export default mongoose.models.UserLedger ||
  mongoose.model<IUserLedger>("UserLedger", UserLedgerSchema);
