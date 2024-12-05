import { computed } from 'vue';

export function useSecurityStatus(security) {
  return computed(() => {
    if (!security) return 'unknown';

    const analysis = security.analysis;
    const auth = security.authentication;

    // High-risk conditions
    if (
      analysis?.safeBrowsingResult?.length > 0 || // Known malicious URLs
      analysis?.linkRisks?.some(risk => risk.domainMimicry) || // Domain mimicry detected
      analysis?.urlMismatches?.length > 0 // URL spoofing detected
    ) {
      return 'high-risk';
    }

    // Warning conditions
    if (
      analysis?.isFlagged || // Explicitly flagged as suspicious
      analysis?.linkRisks?.some(risk => risk.isSuspicious) // Any suspicious links
    ) {
      return 'warning';
    }

    // Check authentication
    const hasDmarcPolicy = auth?.dmarc?.toLowerCase().includes('p=reject') || 
                          auth?.dmarc?.toLowerCase().includes('p=quarantine');
    const authPasses = auth?.summary?.toLowerCase().includes('pass') && 
                      !auth?.summary?.toLowerCase().includes('fail');

    // Secure conditions
    if ((hasDmarcPolicy || authPasses) && !analysis?.linkRisks?.some(risk => risk.isSuspicious)) {
      return 'secure';
    }

    // Caution conditions
    if (
      analysis?.suspiciousKeywords?.length >= 3 || // Multiple suspicious keywords
      (auth?.summary?.toLowerCase().includes('fail') && !hasDmarcPolicy) // Auth failures without DMARC
    ) {
      return 'caution';
    }

    return 'secure'; // Default to secure if no specific issues found
  });
}