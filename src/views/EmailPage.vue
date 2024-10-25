<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex items-center justify-between bg-blue-500 text-white p-4 rounded-md mb-4">
      <h1 class="text-xl font-bold">Phish Finder</h1>
      <button @click="logout" class="bg-red-500 py-2 px-4 rounded-lg hover:bg-red-600">Logout</button>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center text-blue-500">Loading...</div>

    <!-- Error Message -->
    <div v-if="error" class="text-center text-red-500">{{ errorMessage }}</div>

    <!-- Email List -->
    <ul v-if="!loading && paginatedEmails.length > 0" class="space-y-4">
      <li v-for="email in paginatedEmails" :key="email.id"
        class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition" @click="openEmailModal(email)">
        <strong>{{ email?.subject || 'No Subject' }}</strong>

        <!-- Flagged Email Indicator -->
        <div v-if="email.isFlagged" class="flex items-center space-x-2 text-red-500">
          <img src="/images/icon128s.png" alt="suspicious" class="w-6 h-6" />
          <span>🚩 Suspicious</span>
        </div>

        <p class="text-sm text-gray-500">From: {{ email?.from || 'Unknown Sender' }}</p>
        <p class="text-sm text-gray-500">Date: {{ formatDate(email?.date) || 'Unknown Date' }}</p>
        <p class="truncate" v-html="sanitizeEmailBody(email?.snippet || 'No Snippet')"></p>
      </li>
    </ul>

    <!-- Pagination Controls -->
    <PaginationControls v-if="emails.length > 0" :currentPage="currentPage" :nextPageDisabled="nextPageDisabled"
      @prevPage="prevPage" @nextPage="nextPage" @goToHome="goToHome" />
  </div>

  <!-- Modal code in the component -->
  <EmailModal v-if="selectedEmail" :email="selectedEmail" @close="closeEmailModal" />
</template>

<script>
import EmailModal from '@/views/EmailModal.vue';
import PaginationControls from './PaginationControls.vue';
import { emailIsSuspicious } from '@/utils/utils';

export default {
  components: {
    EmailModal,
    PaginationControls,
  },
  data() {
    return {
      emails: [],
      paginatedEmails: [],
      cache: {},
      loading: false,
      error: false,
      errorMessage: '',
      emailLimit: 20,
      maxEmails: 200,
      currentPage: 1,
      emailsPerPage: 5,
      selectedEmail: null,
      nextPageToken: null,
      backgroundFetching: false,
      totalFetchedEmails: 0,
    };
  },
  mounted() {
    this.fetchEmails();
  },
  methods: {
    logout() {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            chrome.storage.local.set({ loggedOut: true }, () => {
              console.log('Logged out, redirecting to login page');
              this.$router.replace('/login');
            });
          });
        } else {
          chrome.storage.local.set({ loggedOut: true }, () => {
            console.log('No token found, redirecting to login');
            this.$router.replace('/login');
          });
        }
      });
    },

    fetchEmails(pageToken = null, isBackground = false) {
      if (!pageToken && this.emails.length > 0 && !isBackground) {
        this.paginateEmails(); // Load from cache if already fetched
        return;
      }

      this.loading = !isBackground;
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (!token) {
          this.handleError('Unable to get the token');
          this.loading = false;
          return;
        }

        this.fetchEmailList(token, pageToken)
          .then(() => {
            if (!isBackground) {
              this.loading = false;
              this.paginateEmails();
            }
            if (this.totalFetchedEmails < this.maxEmails && this.nextPageToken && !this.backgroundFetching) {
              this.lazyLoadEmails(token);
            }
          })
          .catch((err) => {
            this.handleError('Failed to fetch emails');
            this.loading = false;
          });
      });
    },

    // emailpage.vue script

    async fetchEmailList(token, pageToken = null) {
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      url.searchParams.append('maxResults', this.emailLimit.toString());
      url.searchParams.append('labelIds', 'INBOX');
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      try {
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(`Failed to fetch email list: ${data.error.message}`);
        }

        if (data.messages) {
          const fetchPromises = data.messages.map((msg) => this.fetchEmailDetails(token, msg.id));
          const fetchedEmails = await Promise.all(fetchPromises);
          this.emails = [...this.emails, ...fetchedEmails.filter((email) => email)];
          this.totalFetchedEmails += fetchedEmails.length;
          this.nextPageToken = data.nextPageToken || null;

          // Merge flagged emails from Chrome storage with fetched emails
          chrome.storage.local.get(['flaggedEmails'], (result) => {
            console.log('Flagged emails retrieved from storage:', result.flaggedEmails);

            if (result.flaggedEmails) {
              this.emails = this.emails.map(email => {
                const flaggedEmail = result.flaggedEmails.find(f => f.id === email.id);
                if (flaggedEmail) {
                  email.isFlagged = flaggedEmail.isFlagged;
                }
                return email;
              });
            }

            this.analyzeEmails(this.emails); // Analyze new emails
            this.paginateEmails(); // Re-paginate after analysis
          });
        } else {
          this.nextPageToken = null;
        }
      } catch (error) {
        console.error('Error fetching email list:', error);
        this.handleError('Error fetching email list');
      }
    },

    analyzeEmails(emails) {
      emails.forEach(email => {
        if (email.isFlagged === undefined) {
          email.isFlagged = emailIsSuspicious(email);
          console.log('Email analyzed on page:', email.subject, '| isFlagged:', email.isFlagged);
        }
      });
    },

    lazyLoadEmails(token) {
      if (!this.nextPageToken || this.totalFetchedEmails >= this.maxEmails) return;

      this.backgroundFetching = true;

      this.fetchEmailList(token, this.nextPageToken)
        .then(() => {
          this.backgroundFetching = false;
          if (this.totalFetchedEmails < this.maxEmails && this.nextPageToken) {
            this.lazyLoadEmails(token);
          }
        })
        .catch(() => {
          this.backgroundFetching = false;
        });
    },

    fetchEmailDetails(token, messageId) {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

      return fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then((email) => {
          if (!email.payload || !email.payload.headers) {
            return null;
          }

          const body = this.getEmailBody(email.payload);

          return {
            id: email.id,
            subject: this.parseHeader(email.payload.headers, 'Subject'),
            from: this.parseHeader(email.payload.headers, 'From'),
            date: this.parseHeader(email.payload.headers, 'Date'),
            snippet: email.snippet,
            body,
          };
        })
        .catch((error) => console.error('Error fetching email:', error));
    },

    decodeBase64Url(data) {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    },

    getEmailBody(payload) {
      if (payload.parts) {
        const part = payload.parts.find(
          (part) => part.mimeType === 'text/html' || part.mimeType === 'text/plain'
        );
        if (part && part.body && part.body.data) {
          return this.decodeBase64Url(part.body.data);
        }
      } else if (payload.body && payload.body.data) {
        return this.decodeBase64Url(payload.body.data);
      }
      return 'No body content available.';
    },

    sanitizeEmailBody(body) {
      return body.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/&nbsp;/g, ' ');
    },

    paginateEmails() {
      if (this.cache[this.currentPage]) {
        this.paginatedEmails = this.cache[this.currentPage];
      } else {
        const startIndex = (this.currentPage - 1) * this.emailsPerPage;
        const endIndex = startIndex + this.emailsPerPage;
        this.paginatedEmails = this.emails.slice(startIndex, endIndex);
        this.cacheEmails(this.paginatedEmails);
      }
    },

    cacheEmails(emails) {
      if (!this.cache[this.currentPage]) {
        this.cache[this.currentPage] = emails;
      }
    },

    nextPage() {
      if (this.currentPage * this.emailsPerPage < this.emails.length) {
        this.currentPage++;
        this.paginateEmails();
      } else if (this.nextPageToken && typeof this.nextPageToken === 'string') {
        this.fetchEmails(this.nextPageToken);
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.paginateEmails();
      }
    },

    goToHome() {
      this.currentPage = 1;
      this.paginateEmails();
    },

    parseHeader(headers, name) {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : 'Unknown';
    },

    formatDate(date) {
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Date(date).toLocaleDateString(undefined, options);
    },

    handleError(message) {
      this.loading = false;
      this.error = true;
      this.errorMessage = message;
    },

    openEmailModal(email) {
      this.selectedEmail = email;
    },
    closeEmailModal() {
      this.selectedEmail = null;
    },
  },

  computed: {
    nextPageDisabled() {
      return !this.nextPageToken || this.currentPage * this.emailsPerPage >= this.emails.length;
    },
  },
};
</script>

<style scoped>
/* Existing styles */
.loading-spinner,
.error-message,
.no-emails-message {
  text-align: center;
  width: 100%;
}

.email-list {
  width: 100%;
  list-style: none;
  padding: 0;
}

.email-item {
  border-bottom: 1px solid #ddd;
  padding: 10px;
  cursor: pointer;
}

.email-snippet {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #666;
}

.warning-text {
  color: red;
  font-weight: bold;
}
</style>
