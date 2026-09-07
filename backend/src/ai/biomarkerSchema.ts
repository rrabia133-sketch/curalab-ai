import { z } from "zod";

// 1. Schema for an individual lab test metric (e.g., Hemoglobin)
export const BiomarkerItemSchema = z.object({
    name: z.string().describe("Biomarker name, e.g., 'Fasting Blood Glucose'"),
    value: z.number().nullable().describe("Extracted numeric value, or null if non-numeric"),
    unit: z.string().default("").describe("Measurement unit, e.g., 'mg/dL', 'g/dL', '%'"),
    referenceRange: z.string().default("").describe("Normal reference interval, e.g., '70 - 99'"),
    status: z.enum(["NORMAL", "LOW", "HIGH", "CRITICAL", "BORDERLINE"]).describe("Clinical status classification"),
    clinicalSignificance: z.string().describe("Brief 1-sentence plain-English explanation of what this result means"),
});

// 2. Schema for a group of related tests (e.g., Complete Blood Count, Lipid Panel)
export const BiomarkerCategorySchema = z.object({
    categoryName: z.string().describe("Category header, e.g., 'Complete Blood Count (CBC)'"),
    biomarkers: z.array(BiomarkerItemSchema),
});

// 3. Root Schema for the entire clinical analysis
export const AnalysisResultSchema = z.object({
    reportSummary: z.string().describe("A concise 2-3 sentence executive summary of the patient's lab report findings"),
    patientOverview: z.object({
        name: z.string().nullable().optional(),
        age: z.string().nullable().optional(),
        gender: z.string().nullable().optional(),
        collectionDate: z.string().nullable().optional(),
    }),
    categories: z.array(BiomarkerCategorySchema),
    doctorQuestions: z.array(z.string()).describe("3-5 tailored clinical consultation questions for the patient's doctor"),
    criticalFlagsCount: z.number().describe("Total count of abnormal biomarkers (LOW, HIGH, CRITICAL, BORDERLINE)"),
});

// TypeScript type definitions derived automatically from the Zod schemas
export type BiomarkerItem = z.infer<typeof BiomarkerItemSchema>;
export type BiomarkerCategory = z.infer<typeof BiomarkerCategorySchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
