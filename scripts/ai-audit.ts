import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

// AI Auditor - "The Skeptic Agent"
// Purpose: Review code for logical flaws and security vulnerabilities that standard linters miss.

async function auditFile(filePath: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY is missing.");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const filename = path.basename(absolutePath);

  console.log(`🔍 Auditing ${filename} ...`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    You are an Expert Security Auditor and Senior Software Engineer.
    Review the following code file ("${filename}") specifically for:
    1.  **Security Vulnerabilities**: IDOR, Injection, Privilege Escalation, Race Conditions, Information Disclosure.
    2.  **Logical Flaws**: Business logic errors that automated tests might miss.
    3.  **"Vibe Coding" Risks**: Code that looks correct but fundamentally misunderstands the requirements or lifecycle (e.g., side effects in getters, unhandled promises).

    CODE CONTENT:
    \`\`\`typescript
    ${content}
    \`\`\`

    Report Format:
    -   **Summary**: Pass/Fail assessment.
    -   **Critical Issues**: List any high-severity problems found.
    -   **Suggestions**: Concrete refactoring advice.
    
    Be extremely critical. If the code is perfect, say so, but always look for edge cases.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n=============================================");
    console.log("🤖 AI AUDITOR REPORT");
    console.log("=============================================\n");
    console.log(text);
    console.log("\n=============================================");
  } catch (error) {
    console.error("❌ Audit failed:", error);
  }
}

const targetFile = process.argv[2];
if (!targetFile) {
  console.log("Usage: npx ts-node scripts/ai-audit.ts <path-to-file>");
  process.exit(0);
}

auditFile(targetFile);
