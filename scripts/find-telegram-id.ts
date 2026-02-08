
const TOKEN = '8263216534:AAGqK9Pvz1yPko5_JGZUoq7eCtgc3jY0_Iw';

async function findChatId() {
    console.log('Botunuzu kontrol ediyorum...');
    try {
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
        const data = await res.json();

        if (data.result && data.result.length > 0) {
            const lastUpdate = data.result[data.result.length - 1];
            const chatId = lastUpdate.message?.chat.id || lastUpdate.callback_query?.message.chat.id;
            const username = lastUpdate.message?.from.username || lastUpdate.message?.from.first_name;

            console.log('\n✅ BULDUM!');
            console.log(`Kullanıcı: ${username}`);
            console.log(`Chat ID: ${chatId}`);
            console.log('\nBu Chat ID\'yi Vercel\'deki TELEGRAM_CHAT_ID kısmına eklemelisin.');
        } else {
            console.log('\n❌ Henüz mesaj bulunamadı.');
            console.log('Lütfen Telegram\'da bota girip "START" butonuna bas veya herhangi bir şey yaz, sonra tekrar deneyelim.');
        }
    } catch (e) {
        console.error('Hata:', e.message);
    }
}

findChatId();
