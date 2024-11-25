// src/utils/analysis/urlUtils.js
import DOMPurify from 'dompurify';

export const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/g;
    return text.match(urlRegex) || [];
};

export const normalizeUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    } catch {
        return url;
    }
};

export const checkUrlMismatch = (displayText, actualUrl) => {
    const displayUrls = extractUrls(displayText);
    if (displayUrls.length === 0) return false;
    
    const displayDomain = normalizeUrl(displayUrls[0]);
    const actualDomain = normalizeUrl(actualUrl);
    
    return displayDomain !== actualDomain;
};