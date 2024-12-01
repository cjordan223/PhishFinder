<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <Header class="flex-none" />
    
    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Pagination controls -->
        <div class="flex-none p-2 border-b">
          <PaginationControls 
            :currentPage="currentPage"
            :totalPages="totalPages"
            :nextPageDisabled="isNextPageDisabled"
            @prevPage="prevPage"
            @nextPage="nextPage"
            @goToPage="handlePageChange"
          />
        </div>

        <!-- Email list with transition -->
        <div class="flex-1 relative">
          <TransitionGroup
            name="list"
            tag="div"
            class="relative"
          >
            <EmailList 
              :key="currentPage"
              v-if="paginatedEmails.length > 0" 
              :emails="paginatedEmails" 
              @open="openEmailDetail" 
            />
          </TransitionGroup>
        </div>
      </div>

      <!-- Email detail overlay -->
      <Transition
        enter-active-class="transition-transform duration-300 ease-in-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300 ease-in-out"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <EmailDetailPage
          v-if="selectedEmail"
          :email="selectedEmail"
          :show="!!selectedEmail"
          @close="closeEmailDetail"
        />
      </Transition>
    </div>
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
const emailsPerPage = 7;
const nextPageToken = ref(null);
const cache = new Map();

const isNextPageDisabled = computed(() => {
  return !nextPageToken.value && currentPage.value * emailsPerPage >= emails.value.length;
});

const totalPages = computed(() => {
  return Math.ceil(emails.value.length / emailsPerPage);
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

  // If we don't have enough emails for this page, fetch more
  if (endIndex > emails.value.length && nextPageToken.value) {
    fetchEmails(nextPageToken.value);
    return;
  }

  if (cache.has(currentPage.value)) {
    paginatedEmails.value = cache.get(currentPage.value);
  } else {
    const pageEmails = emails.value.slice(startIndex, endIndex);
    
    // Only set and cache if we have a full page or no more emails to fetch
    if (pageEmails.length === emailsPerPage || !nextPageToken.value) {
      paginatedEmails.value = pageEmails;
      cache.set(currentPage.value, pageEmails);
    }
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    paginateEmails();
  }
}

async function nextPage() {
  const nextPageStart = currentPage.value * emailsPerPage;
  
  // If we don't have enough emails for the next page and there are more to fetch
  if (nextPageStart + emailsPerPage > emails.value.length && nextPageToken.value) {
    await fetchEmails(nextPageToken.value);
  }
  
  // Only increment page if we have enough emails or no more to fetch
  if (nextPageStart < emails.value.length || !nextPageToken.value) {
    currentPage.value++;
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

function handlePageChange(page) {
  currentPage.value = page;
  
  // Check if we need to fetch more emails
  const startIndex = (page - 1) * emailsPerPage;
  if (startIndex + emailsPerPage >= emails.value.length && nextPageToken.value) {
    fetchEmails(nextPageToken.value);
  } else {
    paginateEmails();
  }
}

onMounted(() => {
  fetchEmails();
});
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-active {
  position: absolute;
}
</style>