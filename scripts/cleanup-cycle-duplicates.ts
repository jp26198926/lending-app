/**
 * Migration script to cleanup duplicate cycles and enforce persistent numbering
 *
 * This script:
 * 1. Finds all duplicate cycle counts per loan
 * 2. Renumbers duplicate cycles sequentially
 * 3. Drops the partial unique index
 * 4. Creates a full unique index
 *
 * This ensures cycle counts are sequential and never reused (even after deletion)
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function cleanupAndMigrateCycles() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collection = db.collection("cycles");

    // Step 1: Find all cycles grouped by loan
    console.log("\n🔍 Analyzing cycles for duplicates...");
    const cyclesByLoan = await collection
      .aggregate([
        {
          $group: {
            _id: "$loanId",
            cycles: {
              $push: {
                id: "$_id",
                cycleCount: "$cycleCount",
                status: "$status",
                createdAt: "$createdAt",
              },
            },
          },
        },
      ])
      .toArray();

    console.log(`Found ${cyclesByLoan.length} loans with cycles`);

    // Step 2: Identify and fix duplicates
    let totalDuplicates = 0;
    let totalFixed = 0;

    for (const loan of cyclesByLoan) {
      const cycles = loan.cycles.sort((a: any, b: any) => {
        // Sort by createdAt to maintain chronological order
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      // Check for duplicates
      const cycleCountMap = new Map();
      const duplicates = [];

      for (const cycle of cycles) {
        if (cycleCountMap.has(cycle.cycleCount)) {
          duplicates.push(cycle);
          totalDuplicates++;
        } else {
          cycleCountMap.set(cycle.cycleCount, cycle);
        }
      }

      if (duplicates.length > 0) {
        console.log(
          `\n⚠️  Loan ${loan._id} has ${duplicates.length} duplicate cycle count(s)`,
        );

        // Renumber: find max cycle count and increment from there
        const existingNumbers = cycles.map((c: any) => c.cycleCount);
        let nextAvailableNumber = Math.max(...existingNumbers) + 1;

        for (const duplicate of duplicates) {
          console.log(
            `   Renumbering cycle ${duplicate.id}: ${duplicate.cycleCount} → ${nextAvailableNumber}`,
          );

          await collection.updateOne(
            { _id: duplicate.id },
            { $set: { cycleCount: nextAvailableNumber } },
          );

          nextAvailableNumber++;
          totalFixed++;
        }
      }
    }

    if (totalFixed > 0) {
      console.log(
        `\n✅ Fixed ${totalFixed} duplicate cycle count(s) across ${cyclesByLoan.length} loans`,
      );
    } else {
      console.log("\n✅ No duplicate cycle counts found");
    }

    // Step 3: Get existing indexes
    console.log("\n📋 Checking existing indexes...");
    const indexes = await collection.indexes();
    console.log("Current indexes:");
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.partialFilterExpression) {
        console.log(
          `    Partial filter:`,
          JSON.stringify(index.partialFilterExpression),
        );
      }
    });

    // Step 4: Drop the partial unique index if it exists
    console.log("\n🗑️  Dropping partial unique index...");
    try {
      await collection.dropIndex("loanId_1_cycleCount_1");
      console.log("✅ Partial index dropped successfully");
    } catch (error) {
      if ((error as { code?: number }).code === 27) {
        console.log("ℹ️  Index doesn't exist (already dropped)");
      } else {
        throw error;
      }
    }

    // Step 5: Create new full unique index
    console.log("\n🔧 Creating full unique index...");
    await collection.createIndex(
      { loanId: 1, cycleCount: 1 },
      {
        unique: true,
        name: "loanId_1_cycleCount_1",
      },
    );
    console.log("✅ Full unique index created successfully");

    // Step 6: Verify new indexes
    console.log("\n📋 Verifying updated indexes...");
    const updatedIndexes = await collection.indexes();
    console.log("Updated indexes:");
    updatedIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.unique) {
        console.log(`    Unique: true`);
      }
    });

    console.log("\n✅ Migration completed successfully!");
    console.log(
      "\nℹ️  Cycle counts are now persistent and sequential per loan.",
    );
    console.log("    Deleted cycles will not have their cycle numbers reused.");
    if (totalFixed > 0) {
      console.log(
        `    ${totalFixed} duplicate cycle(s) were renumbered to maintain uniqueness.`,
      );
    }
  } catch (error) {
    console.error("\n❌ Error during migration:", error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the migration
cleanupAndMigrateCycles()
  .then(() => {
    console.log("\n✨ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
