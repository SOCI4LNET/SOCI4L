
import { PageContent } from "@/components/app-shell/page-content"

export default function PrivacyPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>Privacy Policy</h1>
                <p className="text-muted-foreground italic">Last updated: February 11, 2026</p>

                <p>
                    At SOCI4L, we prioritize your privacy while providing a transparent Web3 experience. This policy explains how we collect, use, and protect your data.
                </p>

                <h2>1. Blockchain Transparency</h2>
                <p>
                    By design, blockchain data is public and permanent. When you use SOCI4L, your wallet address and associated on-chain transactions/assets are visible to anyone. We cannot modify or delete data that is stored on the Avalanche blockchain. Any information you choose to display on your public profile becomes publicly accessible.
                </p>

                <h2>2. Information We Collect</h2>
                <p>
                    We collect limited information to provide and improve our services:
                </p>
                <ul>
                    <li><strong>Public Wallet Address:</strong> Collected when you connect your wallet to identify your profile.</li>
                    <li><strong>Profile Information:</strong> Any data you voluntarily provide, such as display names, bios, and social media handles.</li>
                    <li><strong>Usage Data:</strong> Information about how you interact with our platform (e.g., profile views, link clicks).</li>
                </ul>

                <h2>3. Analytics and Tracking</h2>
                <p>
                    We use third-party analytics tools to understand platform performance and improve user experience:
                </p>
                <ul>
                    <li><strong>Yandex Metrika:</strong> We use Yandex Metrika to analyze website traffic and user behavior. This tool may collect data such as your IP address, browser type, and page interactions. This data is used solely for internal optimization.</li>
                    <li><strong>Vercel Analytics:</strong> We use Vercel's native analytics to monitor technical performance and speed.</li>
                </ul>

                <h2>4. Cookies and Local Storage</h2>
                <p>
                    We use cookies and browser local storage to maintain your session and preferences:
                </p>
                <ul>
                    <li><strong>Session Management:</strong> We use Privy for secure authentication, which may set essential cookies to verify your wallet signing.</li>
                    <li><strong>Preferences:</strong> We store theme preferences (dark/light mode) in your browser's local storage.</li>
                </ul>

                <h2>5. Third-Party Links</h2>
                <p>
                    SOCI4L allows users to display links to external websites and social media platforms. We are not responsible for the privacy practices or content of these third-party sites.
                </p>

                <h2>6. Data Security</h2>
                <p>
                    We implement industry-standard security measures to protect the data stored in our database. However, no method of transmission over the internet or electronic storage is 100% secure. You are responsible for the security of your own digital wallet.
                </p>

                <h2>7. Your Rights</h2>
                <p>
                    In accordance with applicable data protection laws, you may have the right to access, correct, or request deletion of certain personal data stored on our servers. Since blockchain data is immutable, we cannot delete on-chain records.
                </p>

                <h2>8. Changes to This Policy</h2>
                <p>
                    We may update our Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
                </p>
            </div>
        </PageContent>
    )
}
