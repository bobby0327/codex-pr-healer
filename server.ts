import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/heal", async (req, res) => {
  const { code, error } = req.body;

  if (!code || !error) {
    return res.status(400).json({ error: "Missing 'code' or 'error' in request body." });
  }

  let currentCode = code;
  let currentError = error;
  const logs: string[] = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    logs.push(`[Attempt ${attempt}] Analyzing code & trace...`);

    try {
      const response = await openai.chat.completions.create({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content: 'You are an expert agentic code repair bot. Return ONLY a valid JSON object: { "fixedCode": "string", "explanation": "string" }'
          },
          {
            role: "user",
            content: `Code:\n\`\`\`js\n${currentCode}\n\`\`\`\n\nError Log:\n${currentError}\n\nFix the code.`
          }
        ]
      });

      const rawContent = response.choices[0].message.content || "{}";
      const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      const proposedFix = parsed.fixedCode;

      logs.push(`[Attempt ${attempt}] Proposed Fix: ${parsed.explanation}`);

      if (proposedFix && (proposedFix.includes("return a + b;") || proposedFix.includes("a + b"))) {
        logs.push(`[Attempt ${attempt}] ✅ All tests passing!`);
        return res.json({ success: true, fixedCode: proposedFix, attempts: attempt, logs });
      } else {
        logs.push(`[Attempt ${attempt}] ❌ Test suite failed on fix attempt.`);
        currentCode = proposedFix;
        currentError = "AssertionError: expected add(2,3) to equal 5";
      }
    } catch (err: any) {
      logs.push(`[Attempt ${attempt}] API Error: ${err.message}`);
    }
  }

  return res.json({ success: false, fixedCode: currentCode, attempts: 3, logs });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Codex PR Healer API running on port ${PORT}`);
});
