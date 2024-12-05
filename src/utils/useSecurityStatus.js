import { computed } from 'vue';

export function useSecurityStatus(security) {
  return computed(() => {
    if (!security) return 'unknown';

    const analysis = security.analysis;

    // High-risk conditions
    if (analysis?.safeBrowsingResult?.length > 0 || 
        analysis?.urlMismatches?.length > 0) {
      return 'warning';
    }

    // Only flag suspicious keywords if:
    // 1. There are 3+ matches
    // 2. The email is not from a known legitimate domain
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

    if (!isFromLegitimate && 
        analysis?.suspiciousKeywords?.some(k => k.matches.length >= 3)) {
      return 'caution';
    }

    return 'secure';
  });
}