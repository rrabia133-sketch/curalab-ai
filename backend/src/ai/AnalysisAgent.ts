import { modelManager } from "./ModelManager.js";
import { AnalysisResultSchema, AnalysisResult } from "./biomarkerSchema.js";

/**
 * Extracts structured biomarker panels and clinical insights from raw lab report text.
 */
export async function extractBiomarkersFromText(reportText: string): Promise<AnalysisResult> {
    const systemPrompt = `You are CuraLab AI, a world-class expert clinical laboratory pathologist assistant.
Your job is to accurately read raw clinical lab test report text and extract structured biomarker panels with strict precision.

CRITICAL MEDICAL EXTRACTION RULES:
1. Extract numerical values, standard units (e.g. mg/dL, g/dL, %), and reference ranges.
2. If a value is missing or purely qualitative (e.g., 'Negative'), set value to null.
3. Compare the value to the reference range and strictly classify status as one of:
   - "NORMAL": Value is strictly within reference range.
   - "LOW": Value is below reference range.
   - "HIGH": Value is above reference range.
   - "BORDERLINE": Value is at the exact threshold.
   - "CRITICAL": Value is dangerously out of range.
4. Calculate criticalFlagsCount as the total count of biomarkers that are NOT "NORMAL".
5. Group biomarkers into logical clinical categories (e.g., "Complete Blood Count (CBC)", "Lipid Panel", "Metabolic Panel", "Thyroid Function").
6. Formulate 3-5 specific, thoughtful doctor consultation questions discussing any out-of-range findings.
7. YOUR RESPONSE MUST BE PURE JSON MATCHING THE REQUESTED SCHEMA. No extra chat, no markdown fences.`;

    const userPrompt = `Here is the clinical laboratory report text:

--- BEGIN REPORT ---
${reportText}
--- END REPORT ---

Return a fully populated JSON object matching the AnalysisResult schema.`;

    // 1. Send to Cascading AI Engine (Groq -> Ollama)
    const rawResponse = await modelManager.generateChatCompletion(
        [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        0.1, // low temperature for high factual accuracy
        true // enable JSON mode
    );

    // 2. Clean response in case the model wrapped it in ```json ... ```
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    // 3. Parse JSON & validate with Zod
    try {
        const jsonParsed = JSON.parse(cleaned);
        const validatedResult = AnalysisResultSchema.parse(jsonParsed);
        return validatedResult;
    } catch (err: any) {
        console.error("❌ Schema validation or JSON parse error:", err);
        throw new Error(`Failed to validate AI extraction result: ${err.message}`);
    }
}
