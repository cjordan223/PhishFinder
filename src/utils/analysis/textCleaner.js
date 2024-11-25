// src/utils/analysis/textCleaner.js
import DOMPurify from 'dompurify';

// Simple text sanitization for service worker context
const sanitizeText = (text) => {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[^;]+;/g, '') // Remove HTML entities
        .replace(/(\r\n|\n|\r)/gm, '\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/\s+/g, ' ')
        .trim();
};

export const cleanEmailBody = (body) => {
    try {
        // First pass: Preserve HTML structure for URL analysis
        let preservedHtml = body.replace(/(\r\n|\n|\r)/gm, '\n')
                               .replace(/\n\s*\n\s*\n/g, '\n\n')
                               .trim();

        // Second pass: Clean text without relying on DOM
        let cleanedText = sanitizeText(body)
            .split(/^--\s*$/m)[0]
            .split(/^Sent from/m)[0]
            .trim();

        return {
            preservedHtml,
            cleanedText
        };
    } catch (err) {
        console.error('Error cleaning email body:', err);
        return {
            preservedHtml: body,
            cleanedText: body
        };
    }
};