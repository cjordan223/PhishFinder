<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex items-center justify-between bg-blue-500 text-white p-4 rounded-md mb-4">
      <h1 class="text-xl font-bold">Phish Finder</h1>
      <button @click="logout" class="bg-red-500 py-2 px-4 rounded-lg hover:bg-red-600">
        Logout
      </button>
    </div>

    <button v-if="!emails.length && !loading" @click="fetchEmails(null)" class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600">
      Fetch Emails
    </button>

    <div v-if="loading" class="text-center text-blue-500">Loading...</div>

    <div v-if="error" class="text-center text-red-500">{{ errorMessage }}</div>

    <!-- Email List -->
    <ul v-if="!loading && paginatedEmails.length > 0" class="space-y-4">
      <li v-for="email in paginatedEmails" :key="email.id" class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition"
          @click="openEmailModal(email)">
        <strong>{{ email?.subject || 'No Subject' }}</strong>
        <p class="text-sm text-gray-500">From: {{ email?.from || 'Unknown Sender' }}</p>
        <p class="text-sm text-gray-500">Date: {{ formatDate(email?.date) || 'Unknown Date' }}</p>
        <p class="truncate">{{ truncateSnippet(email?.snippet || 'No Snippet') }}</p>
      </li>
    </ul>

    <!-- Pagination Controls -->
    <div v-if="emails.length > 0" class="flex justify-between mt-6">
      <button @click.prevent="prevPage" :disabled="currentPage === 1" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-300">
        Previous
      </button>
      <button @click.prevent="goToHome" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
        Home
      </button>
      <button @click.prevent="nextPage" :disabled="nextPageDisabled" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-300">
        Next
      </button>
    </div>
  </div>

  <!-- Email Modal -->
  <div v-if="selectedEmail" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
      <h2 class="text-xl font-bold">{{ selectedEmail?.subject || 'No Subject' }}</h2>
      <p><strong>From:</strong> {{ selectedEmail?.from || 'Unknown Sender' }}</p>
      <p><strong>Date:</strong> {{ formatDate(selectedEmail?.date) || 'Unknown Date' }}</p>
      <p><strong>Snippet:</strong> {{ selectedEmail?.snippet || 'No Snippet' }}</p>
      <div v-if="selectedEmail.body" class="mt-4">
        <h3 class="font-semibold">Email Body:</h3>
        <div v-html="sanitizeEmailBody(selectedEmail.body)" class="mt-2"></div>
      </div>
      <button @click="closeEmailModal" class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg mt-6 hover:bg-blue-600">
        Close
      </button>
    </div>
  </div>
</template>

<script>
export default {
  // Script remains unchanged
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
    chrome.storage.local.get('loggedOut', (result) => {
      if (result.loggedOut) {
        console.log('User is logged out, redirecting to login');
        this.$router.push('/login');
      } else {
        this.fetchEmails(); // Proceed to fetch emails if user is logged in
      }
    });
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

    fetchEmailList(token, pageToken = null) {
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      url.searchParams.append('maxResults', this.emailLimit.toString());
      url.searchParams.append('labelIds', 'INBOX');

      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      console.log('Fetching emails from URL:', url.toString());

      return fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then(async (data) => {
          if (data.error) {
            throw new Error(`Failed to fetch email list: ${data.error.message}`);
          }

          if (data.messages) {
            const fetchPromises = data.messages.map((msg) => this.fetchEmailDetails(token, msg.id));
            const fetchedEmails = await Promise.all(fetchPromises);
            this.emails = [...this.emails, ...fetchedEmails.filter((email) => email)];
            this.totalFetchedEmails += fetchedEmails.length;
            this.nextPageToken = data.nextPageToken || null;
          } else {
            this.nextPageToken = null;
          }
        })
        .catch((error) => {
          console.error('Error fetching email list:', error);
          this.handleError('Error fetching email list');
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
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;

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
        .catch(() => null);
    },

    getEmailBody(payload) {
      if (payload.parts) {
        const part = payload.parts.find((part) => part.mimeType === 'text/html' || part.mimeType === 'text/plain');
        if (part && part.body && part.body.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      } else if (payload.body && payload.body.data) {
        return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
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
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(date).toLocaleDateString(undefined, options);
    },

    truncateSnippet(snippet) {
      const maxLength = 100;
      return snippet.length > maxLength ? `${snippet.substring(0, maxLength)}...` : snippet;
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
.app-container {
  width: 100%;
  max-width: 350px; /* Adjust width of the popup */
  height: 600px; /* Adjust height of the popup */
  margin: auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  overflow-y: auto; /* Allow scrolling within the app */
}

.loading-spinner, .error-message, .no-emails-message {
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

.pagination-controls {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.email-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto; /* Allow scrolling for long content */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh; /* Set max height for modal */
  overflow-y: auto; /* Make modal content scrollable */
}

.email-body-content {
  white-space: pre-wrap; /* Preserve formatting for plain text emails */
  overflow-wrap: break-word; /* Break long words */
}
</style>
 