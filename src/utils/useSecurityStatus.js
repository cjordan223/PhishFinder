import { computed } from 'vue';

export function useSecurityStatus(security, senderProfile) {
  return computed(() => {
    if (!security) return 'unknown';

    const analysis = security.analysis;
    const auth = security.authentication;

    // High-risk conditions (serious security threats)
    if (
      analysis?.safeBrowsingResult?.length > 0 || // Known malicious URLs
      analysis?.urlMismatches?.length > 0 || // URL mismatches
      (analysis?.linkRisks?.some(risk => risk.domainMimicry && risk.isSuspicious)) // Domain spoofing
    ) {
      return 'high-risk';
    }

    // Warning conditions
    if (
      analysis?.isFlagged || // Manual flag moves to warning level
      (analysis?.linkRisks?.some(risk => 
        risk.isSuspicious && 
        !risk.domainMimicry && 
        !checkLegitimateRedirect(risk.url)
      ) && analysis?.suspiciousKeywords?.length > 2)
    ) {
      return 'warning';
    }

    // Caution conditions
    if (
      analysis?.suspiciousKeywords?.length > 2 ||
      (auth && (!auth.spf && !auth.dkim && !auth.dmarc)) // Complete lack of authentication
    ) {
      return 'caution';
    }

    return 'secure';
  });
}

function checkLegitimateRedirect(url) {
  if (!url) return false;
  const legitimateRedirects = [
    'click.mailchimp.com',
    'email.mailgun.net',
    'click.sendgrid.net',
    'links.salesforce.com'
  ];
  try {
    const urlObj = new URL(url);
    return legitimateRedirects.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}