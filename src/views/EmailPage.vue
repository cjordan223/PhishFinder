<!-- src/EmailPage.vue-->
<template>
  <Header @logout="logout" />
  <div class="max-w-4xl mx-auto p-4">
    <!-- Include the Header component -->


    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center text-blue-500">Loading...</div>

    <!-- Error Message -->
    <div v-if="error" class="text-center text-red-500">{{ errorMessage }}</div>

    <!-- Pagination Controls -->
    <PaginationControls v-if="emails.length > 0" :currentPage="currentPage" :nextPageDisabled="nextPageDisabled"
      @prevPage="prevPage" @nextPage="nextPage" @goToHome="goToHome" />

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


  </div>

  <!-- Modal code in the component -->
  <EmailModal v-if="selectedEmail" :email="selectedEmail" @close="closeEmailModal" />
</template>

<script>
import Header from './Header.vue';
import EmailModal from '@/views/EmailModal.vue';
import PaginationControls from './PaginationControls.vue';
import { SuspiciousWords } from '@/utils/utils';

export default {
  components: {
    Header,
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
      emails.forEach((email) => {
        if (email.isFlagged === undefined) {
          email.isFlagged = SuspiciousWords(email);
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
      // Replace URL-safe characters with standard Base64 characters
      data = data.replace(/-/g, '+').replace(/_/g, '/');

      // Pad with '=' characters if necessary
      while (data.length % 4) {
        data += '=';
      }

      try {
        // Decode Base64 string
        const decodedData = atob(data);

        // Handle multibyte Unicode characters
        const text = decodeURIComponent(escape(decodedData));
        return text;
      } catch (e) {
        console.error('Failed to decode base64url data', e);
        return '';
      }
    },

    getEmailBody(payload) {
      let body = '';

      const getBody = (parts) => {
        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body && part.body.data) {
            // Prefer HTML content
            body = this.decodeBase64Url(part.body.data);
            return true; // Stop once we have HTML content
          } else if (part.parts) {
            // Recursive call for nested parts
            if (getBody(part.parts)) {
              return true; // Stop if HTML content is found
            }
          } else if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            // Only use plain text if HTML is not found
            body = this.decodeBase64Url(part.body.data);
          }
        }
        return false;
      };

      if (payload.parts) {
        getBody(payload.parts);
      } else if (payload.body && payload.body.data) {
        body = this.decodeBase64Url(payload.body.data);
      }

      return body || 'No body content available.';
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
      if (!this.nextPageDisabled) {
        if (this.currentPage * this.emailsPerPage < this.emails.length) {
          // Just move to the next page if emails are already available
          this.currentPage++;
          this.paginateEmails();
        } else if (this.nextPageToken) {
          // If more emails are available from the backend, fetch more
          this.fetchEmails(this.nextPageToken);
        }
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
    logout() {
      chrome.storage.local.set({ loggedOut: true }, () => {
        this.$router.push('/login');
      });
    },
  },

  computed: {
    nextPageDisabled() {
      // Check if we have more pages based on total emails and emails per page
      return (
        this.currentPage * this.emailsPerPage >= this.emails.length &&
        !this.nextPageToken
      );
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
