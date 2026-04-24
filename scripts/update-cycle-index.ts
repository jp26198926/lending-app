/**
 * Migration script to update Cycle collection index
 *
 * This script:
 * 1. Drops the old unique index on { loanId, cycleCount }
 * 2. Creates a new partial unique index that excludes cancelled cycles
 *
 * This allows reusing cycle counts after cancellation (soft delete)
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { CycleStatus } from "../models/Cycle";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function updateCycleIndex() {
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

    // Get existing indexes
    console.log("\n📋 Checking existing indexes...");
    const indexes = await collection.indexes();
    console.log("Current indexes:");
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the old unique index if it exists
    console.log("\n🗑️  Dropping old unique index...");
    try {
      await collection.dropIndex("loanId_1_cycleCount_1");
      console.log("✅ Old index dropped successfully");
    } catch (error) {
      if ((error as { code?: number }).code === 27) {
        console.log("ℹ️  Index doesn't exist (already dropped)");
      } else {
        throw error;
      }
    }

    // Create new partial unique index
    console.log("\n🔧 Creating new partial unique index...");
    await collection.createIndex(
      { loanId: 1, cycleCount: 1 },
      {
        unique: true,
        partialFilterExpression: {
          status: {
            $in: [
              CycleStatus.ACTIVE,
              CycleStatus.COMPLETED,
              CycleStatus.EXPIRED,
            ],
          },
        },
        name: "loanId_1_cycleCount_1",
      },
    );
    console.log("✅ New partial unique index created successfully");

    // Verify new indexes
    console.log("\n📋 Verifying updated indexes...");
    const updatedIndexes = await collection.indexes();
    console.log("Updated indexes:");
    updatedIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.partialFilterExpression) {
        console.log(
          `    Partial filter:`,
          JSON.stringify(index.partialFilterExpression),
        );
      }
    });

    console.log("\n✅ Index migration completed successfully!");
    console.log(
      "\nℹ️  You can now reuse cycle counts after cancelling cycles.",
    );
  } catch (error) {
    console.error("\n❌ Error during index migration:", error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the migration
updateCycleIndex()
  .then(() => {
    console.log("\n✨ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
