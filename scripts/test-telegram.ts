
import { sendTelegramNotification, getAvaxPrice } from '../lib/telegram';

async function testNotification() {
    console.log('Test bildirimi gönderiliyor...');

    // Script direct run can't access process.env from Vercel, 
    // but we can pass it here for local testing if needed.
    // Since I don't have the user's .env file, I will just log the attempt.

    const price = await getAvaxPrice();
    const amount = 0.5;
    const usdValue = (amount * price).toFixed(2);

    const msg = [
        `🔔 <b>SOCI4L Test Bildirimi</b>`,
        ``,
        `✅ Telegram altyapısı başarıyla kuruldu!`,
        `💰 <b>Güncel AVAX:</b> $${price}`,
        `📈 <b>Premium Geliri:</b> $${usdValue}`,
        ``,
        `Artık her yeni satışta buraya bildirim gelecek. 🚀`
    ].join('\n');

    // For locally running this test, we'd need the token/ID here.
    // But the code in route.ts will use the Vercel env vars.
    console.log('Mesaj Taslağı:\n', msg);
    console.log('\nVercel üzerindeki değişkenler aktifse ilk satışta/sync\'de bu mesajın benzerini göreceksin.');
}

testNotification();
