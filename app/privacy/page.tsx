
import { PageContent } from "@/components/app-shell/page-content"

export default function PrivacyPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>Privacy Policy</h1>
                <p className="text-muted-foreground italic">Last Updated: February 11, 2026</p>

                <p>
                    SOCI4L (“SOCI4L”, “we”, “us”, “our”) is committed to protecting your privacy while providing a transparent Web3 experience.
                </p>

                <p>
                    This Privacy Policy explains what information we collect, how we use it, and how it is handled when you access or use the SOCI4L platform (the “Service”).
                </p>

                <p>
                    By using the Service, you acknowledge and agree to the practices described in this Policy.
                </p>

                <h2>1. Blockchain Transparency</h2>
                <p>
                    Blockchain technology is public and immutable by design. When you use SOCI4L:
                </p>
                <ul>
                    <li>Your wallet address is publicly visible.</li>
                    <li>Your on-chain transactions and digital assets are publicly accessible.</li>
                    <li>Any information you choose to display on your public profile becomes publicly viewable.</li>
                </ul>
                <p>
                    SOCI4L does not control, modify, or delete data stored on the Avalanche blockchain.
                </p>

                <h2>2. Information We Collect</h2>
                <p>We collect limited information necessary to operate and improve the Service.</p>

                <h3 className="text-lg font-semibold mt-4">a. Wallet Information</h3>
                <ul>
                    <li>Public wallet address (collected when you connect your wallet)</li>
                    <li>On-chain data associated with that address (read-only)</li>
                </ul>
                <p>We do not collect private keys or seed phrases.</p>

                <h3 className="text-lg font-semibold mt-4">b. Profile Information</h3>
                <p>Information you voluntarily provide, including: Display name, Biography, Links, Social handles, and Uploaded images.</p>

                <h3 className="text-lg font-semibold mt-4">c. Usage Data</h3>
                <p>Profile views, Link clicks, Page interactions, and Technical performance metrics. This data is used for platform analytics and improvement.</p>

                <h2>3. Analytics and Tracking</h2>
                <p>We use third-party analytics services to understand platform usage and improve performance.</p>

                <p><strong>Yandex Metrika:</strong> May collect IP address, Browser type, Device information, and Interaction behavior. This data is used solely for internal analytics and performance optimization.</p>

                <p><strong>Vercel Analytics:</strong> Used to monitor page load speed, performance metrics, and technical stability. These services may use cookies or similar technologies.</p>

                <h2>4. Cookies and Local Storage</h2>
                <p>We use essential cookies and browser storage for functional purposes only.</p>
                <ul>
                    <li><strong>Authentication:</strong> We use Privy for wallet-based authentication. Privy may set essential cookies to verify wallet signatures and maintain session integrity.</li>
                    <li><strong>Preferences:</strong> Theme settings and certain UI preferences are stored locally in your browser.</li>
                </ul>
                <p>We do not use cookies for advertising purposes.</p>

                <h2>5. How We Use Information</h2>
                <p>We use collected information to operate and maintain the Service, provide wallet-based profile functionality, improve user experience, monitor security, and analyze platform performance. We do not sell personal data.</p>

                <h2>6. Data Storage and Security</h2>
                <p>We implement commercially reasonable technical and organizational measures to protect data stored on our servers. However, no internet transmission is completely secure and blockchain transactions are irreversible. Users are solely responsible for securing their digital wallets.</p>

                <h2>7. Data Retention</h2>
                <p>We retain off-chain profile data for as long as your profile remains active. You may request deletion of off-chain profile information stored on our servers. Blockchain data cannot be deleted due to its immutable nature.</p>

                <h2>8. Third-Party Links</h2>
                <p>SOCI4L allows users to display links to external websites. We are not responsible for the privacy practices or content of third-party sites. Visiting those sites is at your own risk.</p>

                <h2>9. International Users</h2>
                <p>The Service may be accessed globally. By using SOCI4L, you understand that data may be processed in jurisdictions different from your own.</p>

                <h2>10. Your Rights</h2>
                <p>Depending on applicable laws, you may have the right to request access to, correction of, or deletion of off-chain personal data. Blockchain data cannot be altered or erased.</p>

                <h2>11. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. Updated versions will be posted on this page with a revised “Last Updated” date.</p>

                <h2>12. Contact</h2>
                <p>
                    For privacy-related inquiries:<br />
                    Email: <a href="mailto:hello@soci4l.net">hello@soci4l.net</a><br />
                    Website: <a href="https://soci4l.net">https://soci4l.net</a>
                </p>
            </div>
        </PageContent>
    )
}
