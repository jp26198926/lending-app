const fs = require("fs");
const path = require("path");

// Files to update
const filesToUpdate = [
  "app/api/admin/loan/route.ts",
  "app/api/admin/loan/[id]/route.ts",
  "app/api/admin/payment/route.ts",
  "app/api/admin/payment/[id]/route.ts",
  "app/api/admin/cycle/route.ts",
  "app/api/admin/cycle/[id]/route.ts",
  "app/api/admin/ledger/route.ts",
  "app/api/admin/ledger/[id]/route.ts",
  "app/api/admin/userledger/route.ts",
  "app/api/admin/userledger/[id]/route.ts",
];

const corsImports = `import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";`;

const optionsHandler = `
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}`;

function updateFile(filePath) {
  const fullPath = path.join(__dirname, "..", filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, "utf8");

  // 1. Update imports - remove NextResponse
  content = content.replace(
    /import { NextRequest, NextResponse } from "next\/server";/,
    'import { NextRequest } from "next/server";',
  );

  // 2. Add CORS imports after the NextRequest import
  if (!content.includes("handleCorsPreFlight")) {
    content = content.replace(
      /import { NextRequest } from "next\/server";/,
      `import { NextRequest } from "next/server";\n${corsImports}`,
    );
  }

  // 3. Add OPTIONS handler after const PAGE_PATH
  if (!content.includes("export async function OPTIONS")) {
    const pagePathMatch = content.match(/(const PAGE_PATH = ".*";)/);
    if (pagePathMatch) {
      content = content.replace(
        pagePathMatch[1],
        `${pagePathMatch[1]}${optionsHandler}`,
      );
    }
  }

  // 4. Replace NextResponse.json() with corsResponse() or corsErrorResponse()

  // Replace multi-line error responses first (most specific pattern)
  content = content.replace(
    /return NextResponse\.json\(\s*(\{[^}]*error:[^}]*\}),\s*\{\s*status:\s*(\d{3})\s*\},?\s*\);/gs,
    "return corsErrorResponse(request, $1, $2);",
  );

  // Replace multi-line success responses with explicit status
  content = content.replace(
    /return NextResponse\.json\(\s*([^,]+),\s*\{\s*status:\s*200\s*\},?\s*\);/gs,
    "return corsResponse(request, $1, 200);",
  );

  content = content.replace(
    /return NextResponse\.json\(\s*([^,]+),\s*\{\s*status:\s*201\s*\},?\s*\);/gs,
    "return corsResponse(request, $1, 201);",
  );

  // Replace simple responses without status (single line)
  content = content.replace(
    /return NextResponse\.json\(([^;]+)\);(?!\s*\/\/)/g,
    (match, data) => {
      // Check if this is an error object
      if (data.includes("error:")) {
        return `return corsErrorResponse(request, ${data.trim()}, 500);`;
      }
      return `return corsResponse(request, ${data.trim()}, 200);`;
    },
  );

  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✅ Updated: ${filePath}`);
  return true;
}

// Process all files
console.log("🚀 Starting CORS support updates...\n");
let successCount = 0;
let failCount = 0;

filesToUpdate.forEach((file) => {
  if (updateFile(file)) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\n✨ Done! ${successCount} files updated successfully.`);
if (failCount > 0) {
  console.log(`❌ ${failCount} files failed to update.`);
}
