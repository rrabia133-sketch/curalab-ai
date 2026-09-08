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

        // 3. Extract text from the loaded PDF proxy
        const result: any = await extractText(pdf, { mergePages: true });

        let extracted = "";
        if (typeof result?.text === "string") {
            extracted = result.text;
        } else if (Array.isArray(result?.text)) {
            extracted = result.text.join("\n\n");
        } else if (typeof result === "string") {
            extracted = result;
        }

        // 4. Sanitize text (normalize line endings and trim excess whitespace)
        const sanitizedText = extracted
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        console.log(`📄 PDF parsed: ${totalPages} page(s), extracted ${sanitizedText.length} characters.`);

        // 5. Ensure the document isn't a blank or unreadable scan
        if (!sanitizedText || sanitizedText.length < 10) {
            throw new Error(
                "Extracted PDF text is empty or too short. This usually occurs when the PDF is a scanned photo/image rather than a digital document with selectable text. Please upload a digital PDF with readable text."
            );
        }

        return {
            text: sanitizedText,
            totalPages,
        };
    } catch (error: any) {
        throw new Error(error.message);
    }
}
