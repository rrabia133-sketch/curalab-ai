import { z } from "zod";

// 1. Schema for an individual lab test metric
export const BiomarkerItemSchema = z.object({
    name: z.string(),
    value: z.union([z.number(), z.string().transform((val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
    })]).nullable().optional().default(null),
    unit: z.string().optional().default(""),
    referenceRange: z.union([
        z.string(),
        z.object({}).passthrough().transform((obj) => JSON.stringify(obj))
    ]).optional().default("Standard"),
    status: z.enum(["NORMAL", "LOW", "HIGH", "CRITICAL", "BORDERLINE"]).optional().default("NORMAL"),
    clinicalSignificance: z.string().optional().default("Clinical parameter evaluated against standard laboratory ranges."),
    category: z.string().optional().default("General"),
});

// 2. Root Schema for the entire clinical analysis
export const AnalysisResultSchema = z.object({
    reportSummary: z.string().default("Clinical laboratory report analyzed."),
    patientContext: z.object({
        patientName: z.string().nullable().optional().default(null),
        age: z.union([z.string(), z.number()]).nullable().optional().default(null),
        gender: z.string().nullable().optional().default(null),
        collectionDate: z.string().nullable().optional().default(null),
    }).optional().default({
        patientName: null,
        age: null,
        gender: null,
        collectionDate: null,
    }),
    biomarkers: z.array(BiomarkerItemSchema).default([]),
    criticalAlerts: z.array(z.string()).optional().default([]),
    doctorDiscussionQuestions: z.array(z.string()).default([]),
    criticalFlagsCount: z.number().optional().default(0),
});

export type BiomarkerItem = z.infer<typeof BiomarkerItemSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
