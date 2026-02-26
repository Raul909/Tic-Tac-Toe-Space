// Rate Limiter for Socket.IO events

class RateLimiter {
    constructor() {
        this.clientLimits = new Map();

        // Configuration
        this.WINDOW_MS = 1000; // 1 second window
        this.GLOBAL_LIMIT = 10; // Max events per second per socket

        // Specific limits per event type
        this.SPECIFIC_LIMITS = {
            'room:create': 1, // Max 1 room creation per second
            'chat:msg': 5,    // Max 5 chat messages per second
            'game:move': 5,   // Max 5 moves per second
            'room:join': 2    // Max 2 join attempts per second
        };
    }

    /**
     * Check if an event from a socket is allowed
     * @param {string} socketId - The socket ID
     * @param {string} eventName - The event name
     * @returns {boolean} - True if allowed, false if rate limited
     */
    check(socketId, eventName) {
        const now = Date.now();
        let client = this.clientLimits.get(socketId);

        if (!client) {
            client = {
                windowStart: now,
                count: 0,
                specificCounts: {}
            };
            this.clientLimits.set(socketId, client);
        }

        // Reset window if expired
        if (now - client.windowStart > this.WINDOW_MS) {
            client.windowStart = now;
            client.count = 0;
            client.specificCounts = {};
        }

        // Check global limit
        if (client.count >= this.GLOBAL_LIMIT) {
            return false;
        }

        // Check specific limit
        if (this.SPECIFIC_LIMITS[eventName]) {
             const currentSpecific = client.specificCounts[eventName] || 0;
             if (currentSpecific >= this.SPECIFIC_LIMITS[eventName]) {
                 return false;
             }
             client.specificCounts[eventName] = currentSpecific + 1;
        }

        client.count++;
        return true;
    }

    /**
     * Cleanup resources when a socket disconnects
     * @param {string} socketId
     */
    cleanup(socketId) {
        this.clientLimits.delete(socketId);
    }
}

module.exports = new RateLimiter();
