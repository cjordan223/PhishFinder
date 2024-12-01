import { computed } from 'vue';

export function useSecurityStatus(security) {
  return computed(() => {
    if (!security) return 'unknown';

    const analysis = security.analysis;
    const auth = security.authentication;

    // High-risk conditions (real security threats)
    if (
      analysis?.safeBrowsingResult?.length > 0 || // Known malicious URLs
      analysis?.linkRisks?.some(risk => risk.domainMimicry) || // Domain mimicry detected
      analysis?.urlMismatches?.length > 0 || // URL spoofing detected
      auth?.summary?.includes('Fail') // Authentication failures
    ) {
      return 'high-risk';
    }

    // Warning conditions
    if (analysis?.linkRisks?.some(risk => risk.isSuspicious && !risk.domainMimicry)) {
      return 'warning';
    }

    // Caution conditions
    if (analysis?.suspiciousKeywords?.length > 0) {
      return 'caution';
    }

    // If we get here, it's secure
    return 'secure';
  });
}