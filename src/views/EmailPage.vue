<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex items-center justify-between bg-blue-500 text-white p-4 rounded-md mb-4">
      <h1 class="text-xl font-bold">Phish Finder</h1>
      <button @click="logout" class="bg-red-500 py-2 px-4 rounded-lg hover:bg-red-600">Logout</button>
    </div>

    <!-- Fetch Emails Button -->
    <button v-if="!emails.length && !loading" @click="fetchEmails(null)"
      class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600">
      Fetch Emails
    </button>

    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center text-blue-500">Loading...</div>

    <!-- Error Message -->
    <div v-if="error" class="text-center text-red-500">{{ errorMessage }}</div>

    <!-- Email List -->
    <ul v-if="!loading && paginatedEmails.length > 0" class="space-y-4">
      <li v-for="email in paginatedEmails" :key="email.id"
        class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition" @click="openEmailModal(email)">
        <strong>{{ email?.subject || 'No Subject' }}</strong>
        <p class="text-sm text-gray-500">From: {{ email?.from || 'Unknown Sender' }}</p>
        <p class="text-sm text-gray-500">Date: {{ formatDate(email?.date) || 'Unknown Date' }}</p>
        <p class="truncate" v-html="sanitizeEmailBody(email?.snippet || 'No Snippet')"></p>
      </li>
    </ul>


    <!-- Pagination Controls -->
    <div v-if="emails.length > 0" class="flex justify-between mt-6">
      <button @click.prevent="prevPage" :disabled="currentPage === 1"
        class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-300">
        Previous
      </button>
      <button @click.prevent="goToHome" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
        Home
      </button>
      <button @click.prevent="nextPage" :disabled="nextPageDisabled"
        class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-300">
        Next
      </button>
    </div>
  </div>

  <!--  modal code in the component -->
  <EmailModal v-if="selectedEmail" :email="selectedEmail" @close="closeEmailModal" />

</template>


<script>
import EmailModal from '@/views/EmailModal.vue';
import DOMPurify from 'dompurify';

export default {
  components: {
    EmailModal,
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
      analysisResult: null,  // Added this to store the result
    };
  },

  methods: {
    closeEmailModal() {
      this.selectedEmail = null;
    },
    async analyzeEmail() {

      console.log('API Token:', process.env.API_TOKEN); // Add this line before making the API request

      if (!this.selectedEmail) {
        console.error("No email selected for analysis.");
        alert("Please select an email to analyze.");
        return;
      }

      const emailSnippet = this.selectedEmail.body || 'No Snippet';
      console.log('Email snippet:', emailSnippet);

      // Validate the text length (10 to 300 words)
      const wordCount = emailSnippet.trim().split(/\s+/).length;
      console.log(`Word count: ${wordCount}`);

      if (wordCount < 10 || wordCount > 300) {
        console.error("The text must be between 10 and 300 words.");
        alert("The email content must be between 10 and 300 words to analyze.");
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: emailSnippet })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response Error Text:', errorText);
          throw new Error(`Error: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log("AI Detection Result:", result);

        if (result.score !== undefined) {
          alert(`Human Score: ${result.score}%. This email is ${result.score}% likely to be written by a human.`);
        } else if (result.error) {
          console.error("API Error:", result.error);
          alert(`Error analyzing content: ${result.error}`);
        } else {
          alert("An unknown error occurred.");
        }
      } catch (error) {
        console.error("Failed to analyze email:", error);
        alert(`Failed to analyze email: ${error.message}`);
      }
    }
    , logout() {
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

      return fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(response => response.json())
        .then(async (data) => {
          if (data.error) {
            throw new Error(`Failed to fetch email list: ${data.error.message}`);
          }

          if (data.messages) {
            const fetchPromises = data.messages.map((msg) => this.fetchEmailDetails(token, msg.id));
            const fetchedEmails = await Promise.all(fetchPromises);
            // Apply HTML parsing here as well
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
    // refer to this thread for the fix
    // https://stackoverflow.com/questions/24428246/retrieve-email-message-body-in-html-using-gmail-api/24433196#24433196

    fetchEmailDetails(token, messageId) {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

      return fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(response => response.json())
        .then(email => {
          if (!email.payload || !email.payload.headers) {
            return null;
          }

          // Handle multipart emails
          let body = '';
          if (email.payload.mimeType === 'multipart/alternative' && email.payload.parts) {
            let htmlPart = email.payload.parts.find(part => part.mimeType === 'text/html');
            if (htmlPart) {
              body = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            }
          } else if (email.payload.mimeType === 'text/html') {
            body = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }

          return {
            id: email.id,
            subject: this.parseHeader(email.payload.headers, 'Subject'),
            from: this.parseHeader(email.payload.headers, 'From'),
            date: this.parseHeader(email.payload.headers, 'Date'),
            snippet: email.snippet,
            body,
          };
        })
        .catch(error => console.error('Error fetching email:', error));
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

.pagination-controls {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

/* New styles for the login button */
.login-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.login-button:hover {
  background-color: #0056b3;
}
</style>