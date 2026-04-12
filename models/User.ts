import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Status enum
export enum UserStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: mongoose.Types.ObjectId | string;
  rate: number;
  cashReceivable: number;
  capitalContribution: number;
  profitEarned: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId | string;
  updatedBy: mongoose.Types.ObjectId | string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  deletedReason?: string;
  status: UserStatus;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
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
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      default: 0,
    },
    cashReceivable: {
      type: Number,
      default: 0,
    },
    capitalContribution: {
      type: Number,
      default: 0,
    },
    profitEarned: {
      type: Number,
      default: 0,
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
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
UserSchema.index({ roleId: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ email: 1, status: 1 });

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the model
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
