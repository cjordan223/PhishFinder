import { computed } from 'vue';

export function useSecurityStatus(security) {
  return computed(() => {
    if (!security) return 'unknown';

    const analysis = security.analysis;

    // Define legitimate domains first
    const legitimateDomains = [
      'rocketmoney.com',
      'indeed.com',
      'linkedin.com',
      'salesforce.com',
      'mailchimp.com',
      'sendgrid.net'
    ];

    const isFromLegitimate = legitimateDomains.some(domain => 
      security.from?.toLowerCase().includes(domain));

    // High-risk conditions
    if (analysis?.safeBrowsingResult?.length > 0 || 
        analysis?.domainMimicry ||
        analysis?.urlMismatches?.length > 0) {
      return 'high-risk';
    }

    // Warning conditions
    if (analysis?.linkRisks?.some(risk => risk.isSuspicious)) {
      return 'warning';
    }

    // Caution level - Check for suspicious keywords or auth issues
    if (!isFromLegitimate && (
      analysis?.suspiciousKeywords?.some(k => k.matches.length >= 2) ||
      security?.authentication?.spf === 'fail' ||
      security?.authentication?.dkim === 'fail' ||
      security?.authentication?.dmarc === 'fail'
    )) {
      return 'caution';
    }

    return 'secure';
  });
}