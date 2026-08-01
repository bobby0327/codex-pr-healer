import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

interface RepairResult {
  success: boolean;
  fixedCode: string;
  attempts: number;
  logs: string[];
}

async function runSelfHealingLoop(
  brokenCode: string, 
  errorMessage: string, 
  maxRetries = 3
): Promise<RepairResult> {
  let currentCode = brokenCode;
  let currentError = errorMessage;
  const logs: string[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logs.push(`[Attempt ${attempt}] Sending broken snippet + error context to model...`);

    const response = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "You are an expert code repair bot. Return ONLY a valid JSON object: { \"fixedCode\": \"string\", \"explanation\": \"string\" }"
        },
        {
          role: "user",
          content: `Code:\n\`\`\`js\n${currentCode}\n\`\`\`\n\nError Log:\n${currentError}\n\nFix the code.`
        }
      ]
    });

    const rawContent = response.choices[0].message.content || "{}";
    // Sanitize in case model wraps output in markdown backticks
    const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    const proposedFix = parsed.fixedCode;
    logs.push(`[Attempt ${attempt}] Proposed Fix: ${parsed.explanation}`);

    const testResult = simulateTestExecution(proposedFix);

    if (testResult.passed) {
      logs.push(`[Attempt ${attempt}] ✅ Tests Passed successfully!`);
      return { success: true, fixedCode: proposedFix, attempts: attempt, logs };
    } else {
      logs.push(`[Attempt ${attempt}] ❌ Tests Failed: ${testResult.error}`);
      currentCode = proposedFix;
      currentError = testResult.error;
    }
  }

  return { success: false, fixedCode: currentCode, attempts: maxRetries, logs };
}

function simulateTestExecution(code: string) {
  if (code && code.includes("return a + b;")) {
    return { passed: true, error: "" };
  }
  return { passed: false, error: "AssertionError: expected add(2,3) to equal 5, got NaN" };
}

const initialBrokenCode = "function add(a, b) { return a - b; }";
const initialError = "AssertionError: expected add(2,3) to equal 5, got -1";

runSelfHealingLoop(initialBrokenCode, initialError).then((result) => {
  console.log("\n--- AGENT EXECUTION SUMMARY ---");
  console.log(result);
});
