import { computed } from 'vue';

export function useSecurityStatus(security, senderProfile) {
  return computed(() => {
    if (!security) return 'unknown';

    const analysis = security.analysis;
    const auth = security.authentication;

    // Consider sender profile metrics
    const senderRisk = senderProfile?.value ? {
      isNewSender: new Date(senderProfile.value.sender.firstSeen.$date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      hasSuspiciousHistory: senderProfile.value.securityMetrics.suspiciousEmails > 0,
      suspiciousRatio: senderProfile.value.securityMetrics.suspiciousEmails / senderProfile.value.securityMetrics.totalEmails
    } : null;

    // High-risk conditions
    if (
      analysis?.safeBrowsingResult?.length > 0 || // Known malicious URLs
      analysis?.linkRisks?.some(risk => risk.domainMimicry) || // Domain mimicry detected
      analysis?.urlMismatches?.length > 0 || // URL spoofing detected
      (senderRisk?.suspiciousRatio > 0.5) || // Over 50% of sender's emails were suspicious
      auth?.summary?.includes('Fail') // Authentication failures
    ) {
      return 'high-risk';
    }

    // Warning conditions
    if (
      analysis?.linkRisks?.some(risk => risk.isSuspicious && !risk.domainMimicry) ||
      (senderRisk?.isNewSender && senderRisk?.hasSuspiciousHistory)
    ) {
      return 'warning';
    }

    // Caution conditions
    if (
      analysis?.suspiciousKeywords?.length > 0 ||
      senderRisk?.isNewSender
    ) {
      return 'caution';
    }

    return 'secure';
  });
}