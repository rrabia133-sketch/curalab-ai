// backend/src/middleware/fileValidator.ts
import { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";

// Maximum allowed size: 20MB in bytes
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

export async function validatePdfFile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // 1. Check if Multer caught a file
        if (!req.file) {
            res.status(400).json({ error: "No file was uploaded. Please attach a PDF or Lab Image (PNG, JPG, WEBP)." });
            return;
        }

        // 2. Check file size
        if (req.file.size > MAX_FILE_SIZE) {
            res.status(400).json({ error: "File exceeds the 20MB limit." });
            return;
        }

        // 3. Inspect magic bytes / file signature with extension fallback
        const detectedType = await fileTypeFromBuffer(req.file.buffer);
        const hasPdfMagicHeader = req.file.buffer.subarray(0, 10).toString("ascii").includes("%PDF");
        const detectedMime = detectedType?.mime || req.file.mimetype;

        const ext = req.file.originalname.toLowerCase();
        const hasValidExt = /\.(pdf|png|jpe?g|webp)$/i.test(ext);
        const isImageMime = req.file.mimetype.startsWith("image/");

        const isAllowed =
            ALLOWED_MIME_TYPES.includes(detectedMime) ||
            hasPdfMagicHeader ||
            (hasValidExt && (isImageMime || req.file.mimetype === "application/pdf" || req.file.mimetype === "application/octet-stream"));

        if (!isAllowed) {
            res.status(400).json({
                error: "Security Alert: Invalid file type. Only genuine PDF documents and Images (PNG, JPG, WEBP) are supported.",
            });
            return;
        }

        // Attach detected mime or fallback image mime to file object
        if (detectedType?.mime) {
            req.file.mimetype = detectedType.mime;
        } else if (hasValidExt && isImageMime) {
            // Keep existing image mime
        } else if (ext.endsWith(".png")) {
            req.file.mimetype = "image/png";
        } else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) {
            req.file.mimetype = "image/jpeg";
        } else if (ext.endsWith(".webp")) {
            req.file.mimetype = "image/webp";
        }

        next();
    } catch (error: any) {
        res.status(500).json({
            error: "File validation failed.",
            details: error.message,
        });
    }
}

