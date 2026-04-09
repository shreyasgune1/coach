const TelegramBot = require("node-telegram-bot-api");

class TelegramService {
    constructor(token) {
        // Robust polling options for network stability
        const pollingOptions = {
            polling: {
                interval: 300,
                autoStart: true,
                params: {
                    timeout: 10
                }
            }
        };

        this.bot = new TelegramBot(token, pollingOptions);
        
        // Prevents the app from crashing on minor network blips
        this.bot.on("polling_error", (error) => {
            console.warn("⚠️ Polling warning:", error.message);
        });

        console.log("✅ Telegram Service Initialized");
    }

    /**
     * Registers a handler for incoming messages
     * @param {Function} callback 
     */
    onMessage(callback) {
        this.bot.on("message", (msg) => {
            if (!msg.text || msg.from.is_bot) return;
            callback(msg);
        });
    }

    /**
     * Sends a message back to the user
     */
    async sendMessage(chatId, text) {
        try {
            await this.bot.sendMessage(chatId, text);
        } catch (error) {
            console.error("❌ Telegram Send Error:", error.message);
        }
    }

    /**
     * Triggers the "typing..." status
     */
    sendTyping(chatId) {
        this.bot.sendChatAction(chatId, "typing");
    }
}

// CRITICAL: This is what allows index.js to use "new TelegramService"
module.exports = TelegramService;