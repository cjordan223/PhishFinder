<template>
  <div class="space-y-3">
    <!-- SPF Status -->
    <div class="flex items-start gap-3">
      <div class="w-14 text-xs font-medium text-gray-500 pt-1.5 flex items-center gap-1">
        SPF
        <div class="group relative cursor-help">
          <div class="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-gray-500">
            <span class="text-xs">i</span>
          </div>
          <div
            class="absolute left-0 top-full mt-1 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <p class="font-medium mb-1">Sender Policy Framework (SPF)</p>
            <p>Verifies that the sending server is authorized to send emails on behalf of this domain. Helps prevent
              email
              spoofing.</p>
          </div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div :class="[
          'text-xs font-medium px-2.5 py-1.5 rounded-md inline-flex items-center',
          getStatusClass(getStatus(spfDetails || spf))
        ]">
          <span v-if="getStatus(spfDetails || spf) === 'pass'" class="mr-1">✓</span>
          <span v-if="getStatus(spfDetails || spf) === 'fail'" class="mr-1">✗</span>
          {{ spfDetails || spf || 'No record found' }}
        </div>
      </div>
    </div>

    <!-- DKIM Status -->
    <div class="flex items-start gap-3">
      <div class="w-14 text-xs font-medium text-gray-500 pt-1.5 flex items-center gap-1">
        DKIM
        <div class="group relative cursor-help">
          <div class="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-gray-500">
            <span class="text-xs">i</span>
          </div>
          <div
            class="absolute left-0 top-full mt-1 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <p class="font-medium mb-1">DomainKeys Identified Mail (DKIM)</p>
            <p>Digital signature that verifies email hasn't been tampered with during transit. Ensures email integrity
              and
              authenticity.</p>
          </div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div :class="[
          'text-xs font-medium px-2.5 py-1.5 rounded-md inline-flex items-center',
          getStatusClass(getStatus(dkimDetails || dkim))
        ]">
          {{ dkimDetails || dkim || 'No record found' }}
        </div>
      </div>
    </div>

    <!-- DMARC Status -->
    <div class="flex items-start gap-3">
      <div class="w-14 text-xs font-medium text-gray-500 pt-1.5 flex items-center gap-1">
        DMARC
        <div class="group relative cursor-help">
          <div class="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-gray-500">
            <span class="text-xs">i</span>
          </div>
          <div
            class="absolute left-0 top-full mt-1 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <p class="font-medium mb-1">Domain-based Message Authentication (DMARC)</p>
            <p>Policy framework that uses SPF and DKIM to detect and prevent email spoofing. Tells receiving servers how
              to handle authentication failures.</p>
          </div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div :class="[
          'text-xs font-medium px-2.5 py-1.5 rounded-md inline-flex items-center',
          getStatusClass(getStatus(dmarcDetails || dmarc))
        ]">
          <span v-if="getStatus(dmarcDetails || dmarc) === 'pass'" class="mr-1">✓</span>
          <span v-if="getStatus(dmarcDetails || dmarc) === 'fail'" class="mr-1">✗</span>
          {{ dmarcDetails || dmarc || 'No policy found' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  spf: String,
  dkim: String,
  dmarc: String,
  spfDetails: String,
  dkimDetails: String,
  dmarcDetails: String
});

function getStatus(value) {
  if (!value) return 'neutral';
  value = value.toLowerCase();

  if (value.includes('pass')) return 'pass';
  if (value.includes('fail')) return 'fail';

  // For SPF
  if (value.includes('v=spf1')) {
    return (value.includes('redirect=') || value.includes('include=') || value.includes('include:')) ? 'pass' : 'neutral';
  }

  // For DMARC
  if (value.includes('v=dmarc1')) {
    // p=reject is the strongest policy, should be pass
    if (value.includes('p=reject')) return 'pass';
    // p=quarantine is also good, should be pass
    if (value.includes('p=quarantine')) return 'pass';
    // p=none is monitoring only, should be neutral
    if (value.includes('p=none')) return 'neutral';
  }

  // For DKIM
  if (value.includes('no dkim record')) return 'pass'; // Changed from neutral to pass

  return 'neutral';
}

function getStatusClass(status) {
  return {
    'bg-green-100 text-green-700': status === 'pass',
    'bg-red-100 text-red-700': status === 'fail',
    'bg-yellow-100 text-yellow-700': status === 'neutral'
  };
}
</script>