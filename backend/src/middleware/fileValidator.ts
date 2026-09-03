// backend/src/middleware/fileValidator.ts
import { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";

// Maximum allowed size: 20MB in bytes
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function validatePdfFile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // 1. Check if Multer caught a file
        if (!req.file) {
            res.status(400).json({ error: "No file was uploaded. Please attach a PDF." });
            return;
        }

        // 2. Check file size
        if (req.file.size > MAX_FILE_SIZE) {
            res.status(400).json({ error: "File exceeds the 20MB limit." });
            return;
        }

        // 3. Inspect magic bytes to verify genuine PDF signature
        const fileType = await fileTypeFromBuffer(req.file.buffer);

        if (!fileType || fileType.mime !== "application/pdf") {
            res.status(400).json({
                error: "Security Alert: Invalid file type. Only genuine PDF documents are supported.",
            });
            return;
        }

        // File passed all security checks! Move to the next handler
        next();
    } catch (error: any) {
        res.status(500).json({
            error: "File validation failed.",
            details: error.message,
        });
    }
}
