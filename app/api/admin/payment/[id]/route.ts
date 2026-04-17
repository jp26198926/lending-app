import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Payment, { PaymentStatus } from "@/models/Payment";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/Cycle";
import "@/models/User";

const PAGE_PATH = "/admin/payment";

// GET - Fetch a single payment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const payment = await Payment.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue totalPaid balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 },
    );
  }
}

// PUT - Update payment by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();

    const { loanId, cycleId, amount, datePaid, remarks, status } = body;

    await connectDB();

    // Find the payment
    const payment = await Payment.findById(id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Prevent editing cancelled payments
    if (payment.status === PaymentStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Cannot edit a cancelled payment" },
        { status: 403 },
      );
    }

    // Validate numeric values if provided
    if (amount !== undefined && amount < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    // Update fields (paymentNo cannot be modified)
    if (loanId) payment.loanId = loanId;
    if (cycleId) payment.cycleId = cycleId;
    if (amount !== undefined) payment.amount = amount;
    if (datePaid) payment.datePaid = datePaid;
    if (remarks !== undefined) payment.remarks = remarks;
    if (status) payment.status = status;
    payment.updatedBy = user._id;
    payment.updatedAt = new Date();

    await payment.save({ session });

    // Populate and return
    const updatedPayment = await Payment.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue totalPaid balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(updatedPayment, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Payment update transaction error:", err);

    // Handle duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A payment with this payment number already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update payment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete payment by ID (cancel payment)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Deletion reason is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const payment = await Payment.findById(id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Prevent deleting already cancelled payments
    if (payment.status === PaymentStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Payment is already cancelled" },
        { status: 403 },
      );
    }

    // Only completed payments can be cancelled
    if (payment.status !== PaymentStatus.COMPLETED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Only completed payments can be cancelled" },
        { status: 403 },
      );
    }

    // Soft delete (cancel)
    payment.status = PaymentStatus.CANCELLED;
    payment.deletedAt = new Date();
    payment.deletedBy = user._id;
    payment.deletedReason = reason;

    await payment.save({ session });

    // Populate and return
    const deletedPayment = await Payment.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue totalPaid balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(deletedPayment, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Payment deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete payment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
