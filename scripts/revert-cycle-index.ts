/**
 * Migration script to revert Cycle collection index
 *
 * This script:
 * 1. Drops the partial unique index on { loanId, cycleCount }
 * 2. Creates a full unique index to enforce persistent cycle numbering
 *
 * This ensures cycle counts are sequential and never reused (even after deletion)
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function revertCycleIndex() {
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
      if (index.partialFilterExpression) {
        console.log(
          `    Partial filter:`,
          JSON.stringify(index.partialFilterExpression),
        );
      }
    });

    // Drop the partial unique index if it exists
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

    // Create new full unique index
    console.log("\n🔧 Creating full unique index...");
    await collection.createIndex(
      { loanId: 1, cycleCount: 1 },
      {
        unique: true,
        name: "loanId_1_cycleCount_1",
      },
    );
    console.log("✅ Full unique index created successfully");

    // Verify new indexes
    console.log("\n📋 Verifying updated indexes...");
    const updatedIndexes = await collection.indexes();
    console.log("Updated indexes:");
    updatedIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.unique) {
        console.log(`    Unique: true`);
      }
      if (index.partialFilterExpression) {
        console.log(
          `    Partial filter:`,
          JSON.stringify(index.partialFilterExpression),
        );
      }
    });

    console.log("\n✅ Index migration completed successfully!");
    console.log(
      "\nℹ️  Cycle counts are now persistent and sequential per loan.",
    );
    console.log("    Deleted cycles will not have their cycle numbers reused.");
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
revertCycleIndex()
  .then(() => {
    console.log("\n✨ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
