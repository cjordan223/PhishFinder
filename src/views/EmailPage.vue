<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-light to-primary-dark w-full">
    <Header @logout="logout" class="fixed top-0 w-full z-10" />

    <main class="w-full pt-20 pb-8">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 w-full">
          <LoadingSpinner v-if="loading" class="my-8" />
          <ErrorMessage v-if="error" :message="errorMessage" class="my-4" />

          <PaginationControls v-if="emails.length > 0" :currentPage="currentPage" :nextPageDisabled="isNextPageDisabled"
            @prevPage="prevPage" @nextPage="nextPage" class="mb-6" />

          <EmailList v-if="!loading && paginatedEmails.length > 0" :emails="paginatedEmails" @open="openEmailModal"
            class="divide-y divide-gray-200" />

          <EmptyState v-else-if="!loading && !error" class="py-12" />
        </div>
      </div>
    </main>
  </div>

  <EmailModal v-if="selectedEmail" :email="selectedEmail" @close="closeEmailModal" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { emailHelpers, apiHelpers } from '@/utils/utils';
import Header from '@/views/components/Header.vue';
import EmailModal from '@/views//EmailModal.vue';
import PaginationControls from '@/views/components/PaginationControls.vue';
import EmailList from '@/views/EmailList.vue';
import LoadingSpinner from '@/views/components/LoadingSpinner.vue';
import ErrorMessage from '@/views/components/ErrorMessage.vue';
import EmptyState from '@/views/components/EmptyState.vue';

const router = useRouter();
const emails = ref([]);
const paginatedEmails = ref([]);
const loading = ref(false);
const error = ref(false);
const errorMessage = ref('');
const selectedEmail = ref(null);
const currentPage = ref(1);
const emailsPerPage = 5;
const nextPageToken = ref(null);
const cache = new Map();

const isNextPageDisabled = computed(() => {
  return !nextPageToken.value && currentPage.value * emailsPerPage >= emails.value.length;
});

async function fetchEmails(pageToken = null) {
  loading.value = true;
  error.value = false;
  errorMessage.value = '';

  try {
    const token = await apiHelpers.getAuthToken();
    const result = await emailHelpers.fetchEmailBatch(token, pageToken);

    if (result && result.emails) {
      const processedEmails = await Promise.all(result.emails.map(async email => {
        const fullEmail = await emailHelpers.fetchEmailDetails(token, email.id);

        console.log('Raw email before processing:', fullEmail);

        // Preserve the original security data structure
        const processedEmail = {
          id: fullEmail.id,
          content: {
            body: emailHelpers.getEmailBody(fullEmail.payload),
            sanitizedBody: emailHelpers.sanitizeEmailBody(emailHelpers.getEmailBody(fullEmail.payload)),
            urls: emailHelpers.extractUrlsFromEmail(emailHelpers.getEmailBody(fullEmail.payload)),
            rawPayload: fullEmail.payload
          },
          metadata: {
            subject: fullEmail.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
            date: fullEmail.payload?.headers?.find(h => h.name.toLowerCase() === 'date')?.value,
            snippet: fullEmail.snippet || 'No Snippet',
            labels: fullEmail.labelIds || []
          },
          sender: {
            address: fullEmail.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || '',
            displayName: '',
            domain: ''
          },
          raw: fullEmail,
          security: fullEmail.security
        };

        console.log('Processed email with security:', processedEmail);
        return processedEmail;
      }));

      emails.value = [...emails.value, ...processedEmails];
      nextPageToken.value = result.nextPageToken;
      paginateEmails();
    }
  } catch (err) {
    console.error('Error fetching emails:', err);
    error.value = true;
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

function paginateEmails() {
  const startIndex = (currentPage.value - 1) * emailsPerPage;
  const endIndex = startIndex + emailsPerPage;

  if (cache.has(currentPage.value)) {
    paginatedEmails.value = cache.get(currentPage.value);
  } else {
    paginatedEmails.value = emails.value.slice(startIndex, endIndex);
    cache.set(currentPage.value, paginatedEmails.value);
  }
}

function nextPage() {
  if (currentPage.value * emailsPerPage < emails.value.length) {
    currentPage.value++;
    paginateEmails();
  } else if (nextPageToken.value) {
    fetchEmails(nextPageToken.value);
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    paginateEmails();
  }
}

function openEmailModal(email) {
  selectedEmail.value = email;
}

function closeEmailModal() {
  selectedEmail.value = null;
}

function logout() {
  chrome.storage.local.set({ loggedOut: true }, () => {
    router.push('/login');
  });
}

onMounted(() => {
  fetchEmails();
  // console.log("Paginated emails:", paginatedEmails.value); // Log paginated emails

});
</script>

<style scoped>
.bg-gradient {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}
</style>