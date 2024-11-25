// src/utils/analysis/index.js
import { cleanEmailBody } from './textCleaner';
import { UrlAnalyzer } from './urlAnalyzer';

export const analyzeEmail = (emailObject) => {
    const urlAnalyzer = new UrlAnalyzer();
    const { preservedHtml, cleanedText } = cleanEmailBody(emailObject.content.body);
    
    const analysis = {
        urls: urlAnalyzer.analyzeUrls(preservedHtml),
        flags: {
            hasSuspiciousUrls: false,
            hasUrlMismatches: false,
            highLinkCount: false
        },
        riskScore: 0
    };

    // Set flags based on analysis
    analysis.flags.hasSuspiciousUrls = analysis.urls.suspiciousUrls.length > 0;
    analysis.flags.hasUrlMismatches = analysis.urls.urlMismatches.length > 0;
    analysis.flags.highLinkCount = analysis.urls.totalUrls > 10;

    // Calculate risk score
    analysis.riskScore = calculateRiskScore(analysis);

    return analysis;
};

const calculateRiskScore = (analysis) => {
    let score = 0;
    if (analysis.flags.hasSuspiciousUrls) score += 30;
    if (analysis.flags.hasUrlMismatches) score += 40;
    if (analysis.flags.highLinkCount) score += 10;
    return Math.min(score, 100);
};