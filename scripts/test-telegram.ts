
import { sendTelegramNotification, getAvaxPrice } from '../lib/telegram';

async function testNotification() {
    console.log('Sending test notification...');

    // Script direct run can't access process.env from Vercel, 
    // but we can pass it here for local testing if needed.
    // Since I don't have the user's .env file, I will just log the attempt.

    const price = await getAvaxPrice();
    const amount = 0.5;
    const usdValue = (amount * price).toFixed(2);

    const msg = [
        `🔔 <b>SOCI4L Test Notification</b>`,
        ``,
        `✅ Telegram infrastructure successfully set up!`,
        `💰 <b>Current AVAX:</b> $${price}`,
        `📈 <b>Premium Revenue:</b> $${usdValue}`,
        ``,
        `You will now receive notifications here for every new sale. 🚀`
    ].join('\n');

    // For locally running this test, we'd need the token/ID here.
    // But the code in route.ts will use the Vercel env vars.
    console.log('Message Draft:\n', msg);
    console.log('\nIf the Vercel variables are active, you will see a similar message on the first sale/sync.');
}

testNotification();
