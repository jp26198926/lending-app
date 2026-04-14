import { NextRequest, NextResponse } from "next/server";
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

  try {
    await connectDB();

    const body = await request.json();
    const { loanId, cycleId, amount, datePaid, remarks, createdBy, status } =
      body;

    // Validate required fields
    if (!loanId || !cycleId || amount === undefined || !datePaid) {
      return NextResponse.json(
        {
          error: "Loan, cycle, amount, and date paid are required",
        },
        { status: 400 },
      );
    }

    // Validate numeric values
    if (amount < 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    // Auto-generate payment number
    const latestPayment = await Payment.findOne()
      .sort({ createdAt: -1 })
      .select("paymentNo");

    let nextNumber = 1;
    if (latestPayment && latestPayment.paymentNo) {
      const match = latestPayment.paymentNo.match(/PAY-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const paymentNo = `PAY-${String(nextNumber).padStart(5, "0")}`;

    // Create payment
    const payment = await Payment.create({
      paymentNo,
      loanId,
      cycleId,
      amount,
      datePaid,
      remarks,
      createdBy: createdBy || user?._id,
      status: status || PaymentStatus.COMPLETED,
    });

    // Populate references for response
    await payment.populate({
      path: "loanId",
      select: "loanNo clientId principal interestRate terms status",
      populate: {
        path: "clientId",
        select: "firstName middleName lastName email",
      },
    });
    await payment.populate({
      path: "cycleId",
      select: "cycleCount totalDue balance dateDue status",
    });
    await payment.populate("createdBy", "firstName lastName email");

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
