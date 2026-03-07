
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE';

async function findChatId() {
    console.log('Checking your bot...');
    try {
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
        const data = await res.json();

        if (data.result && data.result.length > 0) {
            const lastUpdate = data.result[data.result.length - 1];
            const chatId = lastUpdate.message?.chat.id || lastUpdate.callback_query?.message.chat.id;
            const username = lastUpdate.message?.from.username || lastUpdate.message?.from.first_name;

            console.log('\n✅ FOUND IT!');
            console.log(`User: ${username}`);
            console.log(`Chat ID: ${chatId}`);
            console.log('\nYou need to add this Chat ID to TELEGRAM_CHAT_ID in Vercel.');
        } else {
            console.log('\n❌ No messages found yet.');
            console.log('Please go to the bot on Telegram and press "START" or type anything, then try again.');
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

findChatId();
