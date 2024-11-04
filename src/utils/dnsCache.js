export class DNSCache {
    constructor(cacheDuration = 3600) { // Default 1 hour
        this.cache = new Map();
        this.cacheDuration = cacheDuration * 1000; // Convert to milliseconds
    }

    set(domain, records) {
        this.cache.set(domain, {
            records,
            timestamp: Date.now()
        });
    }

    get(domain) {
        const cached = this.cache.get(domain);
        if (!cached) return null;

        const isExpired = (Date.now() - cached.timestamp) > this.cacheDuration;
        if (isExpired) {
            this.cache.delete(domain);
            return null;
        }

        return cached.records;
    }

    clear() {
        this.cache.clear();
    }
}

// Create and export a singleton instance
export const dnsCache = new DNSCache(
    parseInt(process.env.DNS_CACHE_DURATION || '3600')
); 