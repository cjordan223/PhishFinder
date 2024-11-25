<template>
  <div class="relative min-h-screen">
    <!-- Main email list -->
    <div
      class="min-h-screen bg-gradient-to-br from-primary-light to-primary-dark w-full transform transition-all duration-300 ease-in-out"
      :class="{ 'filter blur-sm translate-x-[-100%]': selectedEmail }">
      <Header @logout="logout" class="fixed top-0 w-full z-10" />

      <main class="w-full pt-20 pb-8">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 w-full">
            <!-- Loading state -->
            <div v-if="loading" class="flex justify-center my-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>

            <!-- Error state -->
            <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
              {{ errorMessage }}
            </div>

            <PaginationControls v-if="emails.length > 0" :currentPage="currentPage"
              :nextPageDisabled="isNextPageDisabled" @prevPage="prevPage" @nextPage="nextPage" class="mb-6" />

            <EmailList v-if="!loading && paginatedEmails.length > 0" :emails="paginatedEmails"
              @open="openEmailDetail" />

            <!-- Empty state -->
            <div v-else-if="!loading && !error" class="text-center py-12 text-gray-500">
              No emails found
            </div>
          </div>
        </div>
      </main>
    </div>

    <Transition enter-active-class="transition-transform duration-300 ease-in-out" enter-from-class="translate-x-full"
      enter-to-class="translate-x-0" leave-active-class="transition-transform duration-300 ease-in-out"
      leave-from-class="translate-x-0" leave-to-class="translate-x-full">
      <EmailDetailPage v-if="selectedEmail" :email="selectedEmail" :show="!!selectedEmail" @close="closeEmailDetail" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { emailHelpers, storageHelpers, apiHelpers } from '@/utils/utils';
import { createEmailObject } from '@/utils/emailStructure';
import Header from '@/components/layout/Header.vue';
import PaginationControls from '@/components/core/PaginationControls.vue';
import EmailList from '@/components/email/EmailList.vue';
import EmailDetailPage from '@/components/email/EmailDetailPage.vue';

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
        // Fetch and process new email
        const fullEmail = await emailHelpers.fetchEmailDetails(token, email.id);
        const emailObject = createEmailObject(fullEmail);

        console.log('🔍 Requesting standalone analysis for:', emailObject.id);
        const analysis = await apiHelpers.getEmailAnalysis(email.id, {
          sender: emailObject.sender,
          subject: emailObject.metadata.subject,
          body: emailObject.content.body,
          htmlBody: emailObject.content.htmlBody,
          timestamp: emailObject.metadata.date,
          headers: emailObject.raw.payload.headers,
          parts: emailObject.raw.payload.parts,
          labels: emailObject.metadata.labels,
          historyId: emailObject.raw.historyId,
          internalDate: emailObject.raw.internalDate,
          sizeEstimate: emailObject.raw.sizeEstimate,
          rawPayload: emailObject.content.rawPayload
        });

        // Merge analysis with email object
        return {
          ...emailObject,
          security: analysis?.security || null
        };
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

function openEmailDetail(email) {
  selectedEmail.value = email;
}

function closeEmailDetail() {
  selectedEmail.value = null;
}

function logout() {
  chrome.storage.local.set({ loggedOut: true }, () => {
    router.push('/login');
  });
}

onMounted(() => {
  fetchEmails();
});
</script>

<style scoped>
.bg-gradient {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}
</style>