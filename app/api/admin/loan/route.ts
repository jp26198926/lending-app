import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Loan, { LoanStatus } from "@/models/Loan";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Client";
import "@/models/User";

const PAGE_PATH = "/admin/loan";

// Generate unique loan number
async function generateLoanNo(): Promise<string> {
  try {
    // Ensure database connection
    await connectDB();

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Find the last loan number for this month
    const prefix = `LN-${year}${month}`;
    const lastLoan = await Loan.findOne({
      loanNo: new RegExp(`^${prefix}`),
    })
      .sort({ loanNo: -1 })
      .select("loanNo")
      .limit(1)
      .lean();

    let sequence = 1;
    if (lastLoan && lastLoan.loanNo) {
      const parts = lastLoan.loanNo.split("-");
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    const loanNo = `${prefix}-${String(sequence).padStart(4, "0")}`;
    console.log(`Generated loan number: ${loanNo}`);
    return loanNo;
  } catch (error) {
    console.error("Error generating loan number:", error);
    // Fallback to timestamp-based number if generation fails
    const timestamp = Date.now().toString().slice(-6);
    return `LN-${timestamp}`;
  }
}

// GET - Fetch all loans with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const assignedStaff = searchParams.get("assignedStaff");
    const terms = searchParams.get("terms");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (clientId) {
      filter.clientId = clientId;
    }

    if (assignedStaff) {
      filter.assignedStaff = assignedStaff;
    }

    if (terms) {
      filter.terms = terms;
    }

    const loans = await Loan.find(filter)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return NextResponse.json(loans, { status: 200 });
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json(
      { error: "Failed to fetch loans" },
      { status: 500 },
    );
  }
}

// POST - Create a new loan
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const {
      clientId,
      principal,
      interestRate,
      terms,
      dateStarted,
      assignedStaff,
      createdBy,
      status,
    } = body;

    // Validate required fields
    if (
      !clientId ||
      principal === undefined ||
      interestRate === undefined ||
      !terms ||
      !dateStarted ||
      !assignedStaff
    ) {
      return NextResponse.json(
        {
          error:
            "Client, principal, interest rate, terms, date started, and assigned staff are required",
        },
        { status: 400 },
      );
    }

    // Validate numeric values
    if (principal < 0) {
      return NextResponse.json(
        { error: "Principal must be a positive number" },
        { status: 400 },
      );
    }

    if (interestRate < 0) {
      return NextResponse.json(
        { error: "Interest rate must be a positive number" },
        { status: 400 },
      );
    }

    // Auto-generate unique loan number
    const loanNo = await generateLoanNo();
    console.log(`Creating loan with loanNo: ${loanNo}`);

    // Create loan
    const loan = await Loan.create({
      loanNo,
      clientId,
      principal,
      interestRate,
      terms,
      dateStarted,
      assignedStaff,
      createdBy: createdBy || user?._id,
      status: status || LoanStatus.ACTIVE,
    });

    console.log(
      `Loan created successfully with ID: ${loan._id}, loanNo: ${loan.loanNo}`,
    );

    // Populate references for response
    await loan.populate(
      "clientId",
      "firstName middleName lastName email phone address",
    );
    await loan.populate("assignedStaff", "firstName lastName email");
    await loan.populate("createdBy", "firstName lastName email");

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);

    // Handle duplicate key error (if any unique constraints exist)
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A loan with this loan number already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create loan" },
      { status: 500 },
    );
  }
}
