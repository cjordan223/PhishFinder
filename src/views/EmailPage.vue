<template>
  <div class="common-dimensions pt-24"> <!-- Adjusted padding top -->
    <Header @logout="logout" />

    <div class="max-w-4xl w-full mx-auto p-4 bg-white shadow-lg rounded-lg mt-24 email-page-background">
      <div v-if="loading" class="text-center text-blue-500">Loading...</div>
      <div v-if="error" class="text-center text-red-500">{{ errorMessage }}</div>
      <PaginationControls v-if="emails.length > 0" :currentPage="currentPage" :nextPageDisabled="nextPageDisabled"
        @prevPage="prevPage" @nextPage="nextPage" @goToHome="goToHome" />
      <ul v-if="!loading && paginatedEmails.length > 0" class="space-y-4">
        <EmailListItem v-for="email in paginatedEmails" :key="email.id" :email="email" @open="openEmailModal" />
      </ul>
    </div>
  </div>
  <EmailModal v-if="selectedEmail" :email="selectedEmail" :isFlaggedForKeywords="selectedEmail.isFlagged"
    @close="closeEmailModal" />
</template>

<script>
import Header from './Header.vue';
import EmailModal from '@/views/EmailModal.vue';
import PaginationControls from './PaginationControls.vue';
import EmailListItem from '@/views/EmailListItem.vue';
import { SuspiciousWords, parseHeader } from '@/utils/utils';
import { linkAnalysis } from '@/utils/utils.js';

export default {
  components: {
    Header,
    EmailModal,
    PaginationControls,
    EmailListItem,
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
    async fetchEmails(pageToken = null, isBackground = false) {
      if (!pageToken && this.emails.length > 0 && !isBackground) {
        this.paginateEmails();
        return;
      }

      this.loading = !isBackground;
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (!token) {
          this.handleError('Unable to get the token');
          this.loading = false;
          return;
        }

        try {
          await this.fetchEmailList(token, pageToken);
          if (!isBackground) {
            this.loading = false;
            this.paginateEmails();
          }
          if (this.totalFetchedEmails < this.maxEmails && this.nextPageToken && !this.backgroundFetching) {
            this.lazyLoadEmails(token);
          }
        } catch (err) {
          this.handleError('Failed to fetch emails');
          this.loading = false;
        }
      });
    },

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

          chrome.storage.local.get(['flaggedEmails'], (result) => {
            if (result.flaggedEmails) {
              this.emails = this.emails.map(email => {
                const flaggedEmail = result.flaggedEmails.find(f => f.id === email.id);
                if (flaggedEmail) {
                  email.isFlagged = flaggedEmail.isFlagged;
                }
                return email;
              });
            }

            this.analyzeEmails(this.emails);
            this.paginateEmails();
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
        // Only analyze if not already analyzed
        if (email.isFlagged === undefined) {
          const result = SuspiciousWords(email);

          // Add debug logging
          console.log('Analyzing email:', {
            subject: email.subject,
            result: result,
            text: `${email.subject || ''} ${email.snippet || ''}`
          });

          // Only set flags if keywords were actually found
          if (result.keywords && result.keywords.length > 0) {
            email.isFlagged = true;
            email.keywords = result.keywords;
          } else {
            email.isFlagged = false;
            email.keywords = [];
          }
        }

        // Check for link risks if not already set
        if (!email.linkRisks) {
          email.linkRisks = linkAnalysis(email.body) || [];
        }
      });
    },

    async lazyLoadEmails(token) {
      if (!this.nextPageToken || this.totalFetchedEmails >= this.maxEmails) return;

      this.backgroundFetching = true;

      try {
        await this.fetchEmailList(token, this.nextPageToken);
        this.backgroundFetching = false;
        if (this.totalFetchedEmails < this.maxEmails && this.nextPageToken) {
          this.lazyLoadEmails(token);
        }
      } catch {
        this.backgroundFetching = false;
      }
    },

    async fetchEmailDetails(token, messageId) {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const email = await response.json();
        if (!email.payload || !email.payload.headers) {
          return null;
        }

        const body = this.getEmailBody(email.payload);

        return {
          id: email.id,
          subject: parseHeader(email.payload.headers, 'Subject'),
          from: parseHeader(email.payload.headers, 'From'),
          date: parseHeader(email.payload.headers, 'Date'),
          snippet: email.snippet,
          body,
        };
      } catch (error) {
        console.error('Error fetching email:', error);
        return null;
      }
    },

    decodeBase64Url(data) {
      data = data.replace(/-/g, '+').replace(/_/g, '/');
      while (data.length % 4) {
        data += '=';
      }

      try {
        const decodedData = atob(data);
        return decodeURIComponent(escape(decodedData));
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
            body = this.decodeBase64Url(part.body.data);
            return true;
          } else if (part.parts) {
            if (getBody(part.parts)) {
              return true;
            }
          } else if (part.mimeType === 'text/plain' && part.body && part.body.data) {
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
          this.currentPage++;
          this.paginateEmails();
        } else if (this.nextPageToken) {
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
      const result = SuspiciousWords(email);
      console.log('Modal opening with analysis:', {
        subject: email.subject,
        result: result
      });

      this.selectedEmail = {
        ...email,
        isFlagged: result.keywords && result.keywords.length > 0,
        keywords: result.keywords || []
      };
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
      return (
        this.currentPage * this.emailsPerPage >= this.emails.length &&
        !this.nextPageToken
      );
    },
  },
};
</script>

<style scoped>
.loading-spinner,
.error-message,
.no-emails-message {
  text-align: center;
  width: 100%;
}

.common-dimensions {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>