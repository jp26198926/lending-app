import mongoose, { Schema, Document } from "mongoose";

// Status enum
export enum PaymentStatus {
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

// Payment interface
export interface IPayment extends Document {
  paymentNo: string;
  loanId: mongoose.Types.ObjectId | string;
  cycleId: mongoose.Types.ObjectId | string;
  amount: number;
  datePaid: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: PaymentStatus;
}

// Payment schema
const PaymentSchema = new Schema<IPayment>(
  {
    paymentNo: {
      type: String,
      required: [true, "Payment number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: [true, "Loan is required"],
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "Cycle",
      required: [true, "Cycle is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    datePaid: {
      type: Date,
      required: [true, "Date paid is required"],
    },
    remarks: {
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
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.COMPLETED,
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
PaymentSchema.index({ paymentNo: 1 }, { unique: true });
PaymentSchema.index({ loanId: 1 });
PaymentSchema.index({ cycleId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ datePaid: 1 });

// Export model
export default mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
