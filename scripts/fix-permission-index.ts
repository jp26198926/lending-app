/**
 * Script to fix Permission collection indexes
 * Run this once to drop the old incorrect index
 *
 * Usage: npx tsx scripts/fix-permission-index.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lending-app";

async function fixPermissionIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collection = db.collection("permissions");

    // List all indexes
    console.log("\nCurrent indexes:");
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the incorrect index
    try {
      console.log('\nDropping old "Permission_1" index...');
      await collection.dropIndex("Permission_1");
      console.log("✅ Old index dropped successfully!");
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("not found")) {
        console.log("ℹ️  Index 'Permission_1' not found (already dropped)");
      } else {
        throw error;
      }
    }

    // Let Mongoose recreate the correct index
    console.log("\nRecreating correct indexes...");
    await collection.createIndex(
      { permission: 1 },
      { unique: true, name: "permission_1" },
    );
    console.log("✅ Correct index created!");

    // List final indexes
    console.log("\nFinal indexes:");
    const finalIndexes = await collection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log("\n✅ Index fix completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing indexes:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

fixPermissionIndexes();
