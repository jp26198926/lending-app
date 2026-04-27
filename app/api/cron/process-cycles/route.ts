import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Cycle, { CycleStatus } from "@/models/Cycle";
import "@/models/Loan";

/**
 * Cron Job Endpoint: Process Expired Cycles
 *
 * This endpoint should be called by cron-job.org or similar service.
 * It will:
 * 1. Find all Active cycles that are past their due date
 * 2. Mark them as Expired
 * 3. Create new cycles automatically with proper due date calculation
 *
 * Security: Requires CRON_SECRET in headers
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Security: Verify cron secret
    const cronSecret = request.headers.get("x-cron-secret");

    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      console.error("Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find all active cycles that are past due date (case-insensitive)
    const expiredCycles = await Cycle.find({
      status: { $regex: new RegExp(`^${CycleStatus.ACTIVE}$`, "i") },
      dateDue: { $lt: today },
    })
      .populate({
        path: "loanId",
        select:
          "loanNo clientId principal interestRate terms dateStarted status",
      })
      .sort({ dateDue: 1 }); // Oldest first

    console.log(
      `[CRON] Found ${expiredCycles.length} expired cycles to process`,
    );

    if (expiredCycles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired cycles to process",
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    const results = {
      expired: [] as string[],
      created: [] as string[],
      errors: [] as { cycleId: string; error: string }[],
    };

    // Process each expired cycle
    for (const cycle of expiredCycles) {
      const session = await mongoose.startSession();

      try {
        await session.startTransaction();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loan = cycle.loanId as any;

        // Double-check cycle is still active (prevent race conditions - case-insensitive)
        const currentCycle = await Cycle.findById(cycle._id).session(session);
        if (
          !currentCycle ||
          currentCycle.status.toLowerCase() !== CycleStatus.ACTIVE.toLowerCase()
        ) {
          await session.abortTransaction();
          continue;
        }

        // 1. Mark current cycle as Expired
        await Cycle.findByIdAndUpdate(
          cycle._id,
          {
            $set: {
              status: CycleStatus.EXPIRED,
              updatedAt: new Date(),
              updatedBy: null, // System action
              expirationReason: `Auto-expired on ${today.toISOString().split("T")[0]} (Due: ${new Date(cycle.dateDue).toISOString().split("T")[0]})`,
            },
          },
          { session },
        );

        results.expired.push(`Cycle #${cycle.cycleCount} - ${loan.loanNo}`);

        // 2. Check if loan is still active before creating new cycle (case-insensitive)
        if (loan.status.toLowerCase() !== "active") {
          await session.commitTransaction();
          console.log(
            `[CRON] Loan ${loan.loanNo} is not active, skipping new cycle creation`,
          );
          continue;
        }

        // 3. Get all cycles for this loan to determine next cycle count (case-insensitive)
        const allCycles = await Cycle.find({
          loanId: loan._id,
          status: { $not: { $regex: /^DELETED$/i } },
        })
          .session(session)
          .sort({ cycleCount: -1 })
          .limit(1);

        const nextCycleCount =
          allCycles.length > 0 ? allCycles[0].cycleCount + 1 : 1;

        // 4. Calculate new due date based on loan terms
        const termsMap: { [key: string]: number } = {
          Weekly: 7,
          Fortnightly: 14,
          Monthly: 30,
        };

        const daysToAdd = termsMap[loan.terms] || 30;

        // Start date is the due date of the expired cycle (most recent)
        const startDate = new Date(cycle.dateDue);
        const newDueDate = new Date(startDate);
        newDueDate.setDate(newDueDate.getDate() + daysToAdd);

        // 5. Calculate cycle amounts
        // If the expired cycle has a balance (unpaid amount), use that as the new principal
        // This ensures unpaid balances are carried forward to the next cycle
        const principal = cycle.balance > 0 ? cycle.balance : loan.principal;
        const interestRate = loan.interestRate;
        const interestAmount = (principal * interestRate) / 100;
        const totalDue = principal + interestAmount;

        // 6. Create new cycle
        const [newCycle] = await Cycle.create(
          [
            {
              loanId: loan._id,
              cycleCount: nextCycleCount,
              principal,
              interestRate,
              interestAmount,
              totalDue,
              totalPaid: 0,
              balance: totalDue,
              profitExpected: interestAmount,
              profitEarned: 0,
              profitRemaining: interestAmount,
              dateDue: newDueDate,
              status: CycleStatus.ACTIVE,
              createdAt: new Date(),
              createdBy: null, // System action
              autoCreated: true,
              previousCycleId: cycle._id,
            },
          ],
          { session },
        );

        results.created.push(
          `Cycle #${nextCycleCount} - ${loan.loanNo} (Due: ${newDueDate.toISOString().split("T")[0]})${cycle.balance > 0 ? ` [Balance carried: ${cycle.balance.toFixed(2)}]` : ""}`,
        );

        await session.commitTransaction();

        console.log(
          `[CRON] Processed: Expired Cycle #${cycle.cycleCount}, Created Cycle #${nextCycleCount} (ID: ${newCycle._id}) for ${loan.loanNo}${cycle.balance > 0 ? ` - Balance carried forward: ${cycle.balance.toFixed(2)}` : ""}`,
        );
      } catch (error: unknown) {
        await session.abortTransaction();
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push({
          cycleId: cycle._id.toString(),
          error: errorMessage,
        });
        console.error(
          `[CRON] Error processing cycle ${cycle._id}:`,
          errorMessage,
        );
      } finally {
        await session.endSession();
      }
    }

    const duration = Date.now() - startTime;

    console.log("[CRON] Process Cycles Summary:", {
      expired: results.expired.length,
      created: results.created.length,
      errors: results.errors.length,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      message: "Cron job completed successfully",
      summary: {
        totalProcessed: expiredCycles.length,
        expired: results.expired.length,
        created: results.created.length,
        errors: results.errors.length,
      },
      details: results,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[CRON] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process cycles",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

// GET endpoint for testing/manual trigger (optional - remove in production)
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call POST method
  return POST(request);
}
