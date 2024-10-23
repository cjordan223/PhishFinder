import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAndAnalyzeEmails } from '../background';
import { fetchEmailDetails } from '../services/emailService';
import { analyzeEmails, saveFlaggedEmails } from '../background';

vi.mock('../services/emailService');
vi.mock('../background', async () => {
    const actual = await vi.importActual('../background');
    return {
        ...actual,
        analyzeEmails: vi.fn(),
        saveFlaggedEmails: vi.fn(),
    };
});

describe('fetchAndAnalyzeEmails', () => {
    beforeEach(() => {
        global.chrome = {
            identity: {
                getAuthToken: vi.fn(),
            },
            runtime: {
                lastError: null,
            },
        };
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should handle authentication failure', () => {
        console.error = vi.fn();
        global.chrome.identity.getAuthToken.mockImplementation((options, callback) => {
            callback(null);
        });

        fetchAndAnalyzeEmails();

        expect(console.error).toHaveBeenCalledWith('Authentication failed', null);
    });

    it('should fetch emails and analyze them', async () => {
        const token = 'test-token';
        const emailData = {
            messages: [{ id: '1' }, { id: '2' }],
            nextPageToken: null,
        };
        const emailDetails = [{ id: '1', from: 'test1@example.com' }, { id: '2', from: 'test2@example.com' }];

        global.chrome.identity.getAuthToken.mockImplementation((options, callback) => {
            callback(token);
        });

        global.fetch.mockResolvedValue({
            json: vi.fn().mockResolvedValue(emailData),
        });

        fetchEmailDetails.mockResolvedValueOnce(emailDetails[0]);
        fetchEmailDetails.mockResolvedValueOnce(emailDetails[1]);

        await fetchAndAnalyzeEmails();

        expect(global.fetch).toHaveBeenCalledWith(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=10',
            { headers: { Authorization: `Bearer ${token}` } }
        );
        expect(fetchEmailDetails).toHaveBeenCalledTimes(2);
        expect(analyzeEmails).toHaveBeenCalledWith(emailDetails);
        expect(saveFlaggedEmails).toHaveBeenCalledWith(emailDetails);
    });
});
