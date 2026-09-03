// backend/src/services/pdfService.ts
import { extractText, getDocumentProxy } from "unpdf";

export interface ParsedPdfResult {
    text: string;
    totalPages: number;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdfResult> {
    try {
        // 1. Convert Buffer into Uint8Array for unpdf
        const uint8Array = new Uint8Array(buffer);

        // 2. Load the PDF document proxy to check page count
        const pdf = await getDocumentProxy(uint8Array);
        const totalPages = pdf.numPages;

        // Guardrail: prevent parsing massive books/documents
        if (totalPages > 50) {
            throw new Error(`PDF exceeds max page limit (50 pages). This document has ${totalPages} pages.`);
        }

        // 3. Extract text from all pages
        const { text } = await extractText(uint8Array, { mergePages: true });

        // 4. Sanitize text (normalize line endings and trim excess whitespace)
        const sanitizedText = text
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        // 5. Ensure the document isn't a blank or unreadable scan
        if (!sanitizedText || sanitizedText.length < 20) {
            throw new Error(
                "Extracted PDF text is too short or empty. Please ensure the document is a readable digital PDF (not a blank/blurry scanned image)."
            );
        }

        return {
            text: sanitizedText,
            totalPages,
        };
    } catch (error: any) {
        throw new Error(`PDF parsing failed: ${error.message}`);
    }
}
