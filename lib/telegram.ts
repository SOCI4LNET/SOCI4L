
/**
 * Telegram Notification Helper
 */

export async function sendTelegramNotification(message: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.log('[Telegram] Missing token or chat ID, skipping notification.');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[Telegram] Failed to send message:', error);
        }
    } catch (error) {
        console.error('[Telegram] Error sending notification:', error);
    }
}

export async function getAvaxPrice(): Promise<number> {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd');
        const data = await res.json();
        return data['avalanche-2']?.usd || 0;
    } catch (e) {
        console.error('[PriceSync] Failed to fetch AVAX price:', e);
        return 0;
    }
}
