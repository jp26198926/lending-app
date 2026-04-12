import mongoose, { Schema, Document } from "mongoose";

// Terms enum
export enum LoanTerms {
  WEEKLY = "Weekly",
  FORTNIGHTLY = "Fortnightly",
  MONTHLY = "Monthly",
}

// Status enum
export enum LoanStatus {
  ACTIVE = "Active",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

// Loan interface
export interface ILoan extends Document {
  loanNo: string;
  clientId: mongoose.Types.ObjectId | string;
  principal: number;
  interestRate: number;
  terms: LoanTerms;
  dateStarted: Date;
  assignedStaff: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: LoanStatus;
}

// Loan schema
const LoanSchema = new Schema<ILoan>(
  {
    loanNo: {
      type: String,
      required: [true, "Loan number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
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
    terms: {
      type: String,
      enum: Object.values(LoanTerms),
      required: [true, "Terms is required"],
    },
    dateStarted: {
      type: Date,
      required: [true, "Date started is required"],
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned staff is required"],
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
      enum: Object.values(LoanStatus),
      default: LoanStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
LoanSchema.index({ loanNo: 1 }, { unique: true });
LoanSchema.index({ status: 1 });
LoanSchema.index({ clientId: 1, status: 1 });
LoanSchema.index({ assignedStaff: 1, status: 1 });
LoanSchema.index({ dateStarted: -1 });
LoanSchema.index({ createdAt: -1 });

// Export model
const Loan = mongoose.models.Loan || mongoose.model<ILoan>("Loan", LoanSchema);
export default Loan;
