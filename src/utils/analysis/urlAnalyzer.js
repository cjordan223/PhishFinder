// src/utils/analysis/urlAnalyzer.js
import { extractUrls, checkUrlMismatch } from './urlUtils';

export class UrlAnalyzer {
    analyzeUrls(emailContent) {
        const urls = extractUrls(emailContent);
        const analysis = {
            totalUrls: urls.length,
            suspiciousUrls: [],
            urlMismatches: []
        };

        urls.forEach(url => {
            // Check for suspicious patterns
            if (this.isSuspiciousUrl(url)) {
                analysis.suspiciousUrls.push(url);
            }

            // Check for URL mismatches in HTML content
            if (checkUrlMismatch(emailContent, url)) {
                analysis.urlMismatches.push(url);
            }
        });

        return analysis;
    }

    isSuspiciousUrl(url) {
        const suspiciousPatterns = [
            /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,  // IP addresses
            /bit\.ly|tinyurl\.com|goo\.gl/i,        // URL shorteners
            /[^a-zA-Z0-9-.]|_{2,}|-{2,}|\.\./       // Unusual characters
        ];

        return suspiciousPatterns.some(pattern => pattern.test(url));
    }
}