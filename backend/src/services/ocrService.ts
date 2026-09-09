import { createWorker } from "tesseract.js";

/**
 * Extracts raw clinical text from an image buffer (CBC slip, lab scan, blood work photo) using Tesseract OCR.
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    console.log("🔍 Extracting text from lab report image using OCR engine...");
    const worker = await createWorker("eng");
    try {
        const ret = await worker.recognize(imageBuffer);
        const text = ret.data.text.trim();
        console.log(`✅ OCR extracted ${text.length} characters from image`);
        return text;
    } finally {
        await worker.terminate();
    }
}
