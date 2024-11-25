// src/utils/emailAnalysis.js
import { UrlAnalyzer } from 'phishfinder-analysis';

export async function analyzeEmail(emailData) {
  const analyzer = new UrlAnalyzer({
    safeBrowsingApiKey: import.meta.env.VITE_SAFE_BROWSING_API_KEY
  });

  const analysis = await analyzer.analyze(
    emailData.content?.htmlBody || '',
    emailData.content?.body || ''
  );

  return {
    security: {
      analysis: {
        isFlagged: analysis.urlMismatches.length > 0 || analysis.flaggedUrls.length > 0,
        linkRisks: analysis.linkRisks,
        urlMismatches: analysis.urlMismatches,
        allUrls: analysis.allUrls
      }
    }
  };
}