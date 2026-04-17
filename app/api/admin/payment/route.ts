import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Payment, { PaymentStatus } from "@/models/Payment";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/Cycle";
import "@/models/User";

const PAGE_PATH = "/admin/payment";

// GET - Fetch all payments with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const loanId = searchParams.get("loanId");
    const cycleId = searchParams.get("cycleId");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (loanId) {
      filter.loanId = loanId;
    }

    if (cycleId) {
      filter.cycleId = cycleId;
    }

    const payments = await Payment.find(filter)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ datePaid: -1, createdAt: -1 });

    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

// POST - Create a new payment
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const { loanId, cycleId, amount, datePaid, remarks, status } = body;

    // Validate required fields
    if (!loanId || !cycleId || amount === undefined || !datePaid) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error: "Loan, cycle, amount, and date paid are required",
        },
        { status: 400 },
      );
    }

    // Validate numeric values
    if (amount < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    await connectDB();

    // Auto-generate payment number within transaction
    const latestPayment = await Payment.findOne()
      .sort({ createdAt: -1 })
      .select("paymentNo")
      .session(session);

    let nextNumber = 1;
    if (latestPayment && latestPayment.paymentNo) {
      const match = latestPayment.paymentNo.match(/PAY-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const paymentNo = `PAY-${String(nextNumber).padStart(5, "0")}`;

    // Create payment
    const payment = await Payment.create(
      [
        {
          paymentNo,
          loanId,
          cycleId,
          amount,
          datePaid,
          remarks,
          createdBy: user._id,
          status: status || PaymentStatus.COMPLETED,
        },
      ],
      { session },
    );

    // Populate references for response
    await payment[0].populate({
      path: "loanId",
      select: "loanNo clientId principal interestRate terms status",
      populate: {
        path: "clientId",
        select: "firstName middleName lastName email",
      },
    });
    await payment[0].populate({
      path: "cycleId",
      select: "cycleCount totalDue balance dateDue status",
    });
    await payment[0].populate("createdBy", "firstName lastName email");

    await session.commitTransaction();

    return NextResponse.json(payment[0], { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Payment creation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
