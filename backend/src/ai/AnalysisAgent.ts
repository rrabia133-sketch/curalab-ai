import { modelManager } from "./ModelManager.js";
import { AnalysisResultSchema, AnalysisResult } from "./biomarkerSchema.js";

/**
 * Extracts structured biomarker panels and clinical insights from raw lab report text.
 */
export async function extractBiomarkersFromText(reportText: string): Promise<AnalysisResult> {
    const systemPrompt = `You are CuraLab AI, an expert clinical pathologist assistant.
Extract all structured biomarkers from this lab report and return ONLY a valid JSON object strictly matching this schema:

{
  "reportSummary": "2-3 sentence executive clinical summary of findings.",
  "patientContext": {
    "patientName": "Patient name or null",
    "age": 45,
    "gender": "Male or Female or null",
    "collectionDate": "Date or null"
  },
  "biomarkers": [
    {
      "name": "Biomarker Name (e.g. Hemoglobin, Fasting Blood Glucose, Total Cholesterol)",
      "value": 14.2,
      "unit": "g/dL",
      "referenceRange": "13.5 - 17.5",
      "status": "NORMAL",
      "clinicalSignificance": "Brief 1-sentence plain-English explanation.",
      "category": "Complete Blood Count (CBC)"
    }
  ],
  "criticalAlerts": ["Any urgent critical abnormal finding warnings"],
  "doctorDiscussionQuestions": [
    "3-5 thoughtful consultation questions for their physician"
  ],
  "criticalFlagsCount": 0
}

CRITICAL RULES:
- Strictly set status to one of: "NORMAL", "LOW", "HIGH", "CRITICAL", "BORDERLINE".
- Extract numeric value (or null if non-numeric).
- Always return valid JSON only.`;

    const userPrompt = `CLINICAL LAB REPORT TEXT:\n\n${reportText}\n\nExtract and return the JSON object:`;

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
    cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

    // 3. Parse JSON & validate with Zod
    try {
        const jsonParsed = JSON.parse(cleaned);

        // Normalize if LLM nested biomarkers under categories
        if (Array.isArray(jsonParsed.categories) && (!jsonParsed.biomarkers || jsonParsed.biomarkers.length === 0)) {
            const flattened: any[] = [];
            for (const cat of jsonParsed.categories) {
                if (Array.isArray(cat.biomarkers)) {
                    for (const b of cat.biomarkers) {
                        flattened.push({
                            ...b,
                            category: b.category || cat.categoryName || "General",
                        });
                    }
                }
            }
            jsonParsed.biomarkers = flattened;
        }

        // Normalize doctor questions naming
        if (!jsonParsed.doctorDiscussionQuestions && Array.isArray(jsonParsed.doctorQuestions)) {
            jsonParsed.doctorDiscussionQuestions = jsonParsed.doctorQuestions;
        }

        const validatedResult = AnalysisResultSchema.parse(jsonParsed);
        return validatedResult;
    } catch (err: any) {
        console.error("❌ Schema validation or JSON parse error:", err);
        throw new Error(`Failed to validate AI extraction result: ${err.message}`);
    }
}
