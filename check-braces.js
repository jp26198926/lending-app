const fs = require("fs");

const content = fs.readFileSync(
  "app/(main)/admin/loan/[id]/cycle/page.tsx",
  "utf8",
);
const lines = content.split("\n");

// Check lines 954-1093 (0-indexed: 953-1092)
const startLine = 953;
const endLine = 1092;

let braceStack = [];
let parenStack = [];

for (let i = startLine; i <= endLine; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j - 1] : "";
    const nextChar = j < line.length - 1 ? line[j + 1] : "";

    // Skip if inside a string (simple heuristic)
    let inString = false;
    let stringChar = null;
    for (let k = 0; k < j; k++) {
      if (
        (line[k] === '"' || line[k] === "'" || line[k] === "`") &&
        (k === 0 || line[k - 1] !== "\\")
      ) {
        if (!inString) {
          inString = true;
          stringChar = line[k];
        } else if (line[k] === stringChar) {
          inString = false;
          stringChar = null;
        }
      }
    }

    if (inString) continue;

    if (char === "{") {
      braceStack.push({ line: lineNum, col: j });
    } else if (char === "}") {
      if (braceStack.length === 0) {
        console.log(`Extra closing brace at line ${lineNum}, col ${j}`);
      } else {
        braceStack.pop();
      }
    } else if (char === "(") {
      parenStack.push({ line: lineNum, col: j });
    } else if (char === ")") {
      if (parenStack.length === 0) {
        console.log(`Extra closing paren at line ${lineNum}, col ${j}`);
      } else {
        parenStack.pop();
      }
    }
  }
}

console.log("\nRemaining unclosed braces:");
braceStack.forEach((b) => console.log(`  Line ${b.line}, col ${b.col}`));
console.log(`\nRemaining unclosed parens:`);
parenStack.forEach((p) => console.log(`  Line ${p.line}, col ${p.col}`));
