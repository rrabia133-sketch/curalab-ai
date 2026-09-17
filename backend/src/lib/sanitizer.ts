/**
 * Sanitizes patient Protected Health Information (PHI) & PII
 * in accordance with HIPAA Safe Harbor guidelines before passing data to AI models.
 */
export function sanitizePatientPHI(rawText: string): string {
    if (!rawText) return "";

    return rawText
        // Redact Emails
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
        // Redact Phone Numbers (US/International standard formats)
        .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[PHONE_REDACTED]")
        // Redact Social Security Numbers (SSN)
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]")
        // Redact Medical Record Numbers (MRN) / Patient IDs
        .replace(/(MRN|Medical Record Number|Patient ID)[:\s]+[A-Za-z0-9-]+/gi, "$1: [MRN_REDACTED]");
}
