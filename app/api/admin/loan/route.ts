import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Loan, { LoanStatus, LoanTerms } from "@/models/Loan";
import Cycle, { CycleStatus } from "@/models/Cycle";
import Ledger, {
  LedgerType,
  LedgerDirection,
  LedgerStatus,
} from "@/models/Ledger";
import Settings from "@/models/Settings";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Client";
import "@/models/User";

const PAGE_PATH = "/admin/loan";

// Calculate due date based on loan terms
function calculateDueDate(dateStarted: Date, terms: LoanTerms): Date {
  const dueDate = new Date(dateStarted);

  switch (terms) {
    case LoanTerms.WEEKLY:
      dueDate.setDate(dueDate.getDate() + 7);
      break;
    case LoanTerms.FORTNIGHTLY:
      dueDate.setDate(dueDate.getDate() + 14);
      break;
    case LoanTerms.MONTHLY:
      dueDate.setMonth(dueDate.getMonth() + 1);
      break;
    default:
      // Default to 30 days if terms not recognized
      dueDate.setDate(dueDate.getDate() + 30);
  }

  return dueDate;
}

// Generate unique loan number
async function generateLoanNo(
  session: mongoose.ClientSession,
): Promise<string> {
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
      .session(session)
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const {
      clientId,
      principal,
      interestRate,
      terms,
      dateStarted,
      assignedStaff,
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
      await session.abortTransaction();
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
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Principal must be a positive number" },
        { status: 400 },
      );
    }

    if (interestRate < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Interest rate must be a positive number" },
        { status: 400 },
      );
    }

    await connectDB();

    // ===== STEP 1: CHECK CASH ON HAND =====
    // Fetch Settings document
    const settings = await Settings.findOne().session(session);

    if (!settings) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error:
            "Settings not found. Please configure application settings first.",
        },
        { status: 404 },
      );
    }

    // Validate if loan amount exceeds available cash
    if (principal > settings.cashOnHand) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error: `Insufficient cash on hand. Available: ₱${settings.cashOnHand.toLocaleString()}, Required: ₱${principal.toLocaleString()}`,
        },
        { status: 400 },
      );
    }

    console.log(
      `Cash validation passed: Available ₱${settings.cashOnHand}, Loan ₱${principal}`,
    );

    // ===== STEP 2: GENERATE LOAN NUMBER =====
    // Auto-generate unique loan number within transaction
    const loanNo = await generateLoanNo(session);
    console.log(`Creating loan with loanNo: ${loanNo}`);

    // ===== STEP 3: CREATE LOAN RECORD =====
    // Create loan
    const loan = await Loan.create(
      [
        {
          loanNo,
          clientId,
          principal,
          interestRate,
          terms,
          dateStarted,
          assignedStaff,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: status || LoanStatus.ACTIVE,
        },
      ],
      { session },
    );

    console.log(
      `Loan created successfully with ID: ${loan[0]._id}, loanNo: ${loan[0].loanNo}`,
    );

    // ===== STEP 4: AUTO-CREATE FIRST CYCLE =====
    // Calculate first cycle details
    const interestAmount = (principal * interestRate) / 100;
    const totalDue = principal + interestAmount;
    const dateDue = calculateDueDate(new Date(dateStarted), terms);

    console.log(
      `Creating first cycle for loan ${loan[0].loanNo}: principal=${principal}, interestRate=${interestRate}, interestAmount=${interestAmount}, totalDue=${totalDue}, dateDue=${dateDue}`,
    );

    // Create first cycle
    const firstCycle = await Cycle.create(
      [
        {
          loanId: loan[0]._id,
          cycleCount: 1,
          principal: principal,
          interestRate: interestRate,
          interestAmount: interestAmount,
          totalDue: totalDue,
          totalPaid: 0,
          balance: totalDue,
          profitExpected: interestAmount,
          profitEarned: 0,
          profitRemaining: interestAmount,
          dateDue: dateDue,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: CycleStatus.ACTIVE,
        },
      ],
      { session },
    );

    console.log(
      `First cycle created successfully with ID: ${firstCycle[0]._id}, cycleCount: ${firstCycle[0].cycleCount}`,
    );

    // ===== STEP 5: CREATE LEDGER ENTRY (LOAN RELEASE - OUT) =====
    const ledgerDate = new Date(dateStarted);
    const ledgerDescription = `Loan released to ${loan[0].clientId} - ${loan[0].loanNo}`;

    await Ledger.create(
      [
        {
          date: ledgerDate,
          type: LedgerType.LOAN_RELEASE,
          direction: LedgerDirection.OUT,
          amount: principal,
          loanId: loan[0]._id,
          description: ledgerDescription,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: LedgerStatus.COMPLETED,
        },
      ],
      { session },
    );

    console.log(
      `Ledger entry created: LOAN_RELEASE, OUT, Amount: ₱${principal}`,
    );

    // ===== STEP 6: DEDUCT CASH ON HAND =====
    await Settings.findByIdAndUpdate(
      settings._id,
      {
        $inc: {
          cashOnHand: -principal, // Deduct loan amount
        },
        $set: {
          updatedBy: new mongoose.Types.ObjectId(user!.userId),
          updatedAt: new Date(),
        },
      },
      { session },
    );

    console.log(
      `Cash on hand updated: ₱${settings.cashOnHand} - ₱${principal} = ₱${settings.cashOnHand - principal}`,
    );

    // ===== STEP 7: POPULATE REFERENCES FOR RESPONSE =====
    // Populate references for response
    await loan[0].populate(
      "clientId",
      "firstName middleName lastName email phone address",
    );
    await loan[0].populate("assignedStaff", "firstName lastName email");
    await loan[0].populate("createdBy", "firstName lastName email");

    await session.commitTransaction();

    return NextResponse.json(loan[0], { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Loan creation transaction error:", err);

    // Handle duplicate key error (if any unique constraints exist)
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A loan with this loan number already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create loan",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
