
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

                <h2>1. Data Controller and Legal Basis</h2>
                <p>
                    SOCI4L acts as the <strong>data controller</strong> for off-chain personal data collected through the Service. SOCI4L is independently operated and responsible for off-chain data processing.
                </p>
                <p>
                    We process personal data based on <strong>user consent</strong> and our <strong>legitimate interest</strong> in operating, securing, and improving the Service. When you connect your wallet or provide profile information, you consent to the processing of your data as described in this Policy. Where required by applicable law, we rely on user consent for analytics tracking and provide the ability to disable non-essential cookies through browser settings.
                </p>

                <h2>2. Eligibility and Minors</h2>
                <p>
                    The Service is not intended for individuals under 18.
                </p>

                <h2>3. Blockchain Transparency</h2>
                <p>
                    Blockchain technology is public and immutable by design. When you use SOCI4L:
                </p>
                <ul>
                    <li>Your wallet address is publicly visible.</li>
                    <li>Your on-chain transactions and digital assets are publicly accessible via the Avalanche C-Chain.</li>
                    <li>Any information you choose to display on your public profile becomes publicly viewable.</li>
                </ul>
                <p>
                    SOCI4L does not control, modify, or delete data stored on the blockchain. Such data remains accessible to anyone via blockchain explorers and indexing services.
                </p>

                <h2>4. Information We Collect</h2>
                <p>We collect limited information necessary to operate and improve the Service.</p>

                <h3 className="text-lg font-semibold mt-4">a. Wallet Information</h3>
                <ul>
                    <li>Public wallet address (collected via Privy when you connect your wallet).</li>
                    <li>On-chain data associated with that address (read-only snapshots for profile display).</li>
                </ul>
                <p><strong>Security Note:</strong> We never collect or store your private keys, recovery phrases, or wallet passwords.</p>

                <h3 className="text-lg font-semibold mt-4">b. Profile Information</h3>
                <p>Information you voluntarily provide to customize your SOCI4L profile, including: Display name, Biography, custom Links, Social handles, and uploaded images.</p>

                <h3 className="text-lg font-semibold mt-4">c. Usage and Technical Data</h3>
                <p>We collect data on profile views, link clicks, page interactions, and technical performance metrics. This includes <strong>IP addresses</strong> collected by our analytics providers for security and performance optimization purposes.</p>

                <h2>5. Analytics and Tracking</h2>
                <p>We use third-party analytics services to understand platform usage:</p>

                <p><strong>Yandex Metrika:</strong> This service may collect your IP address, browser type, device information, and interaction behavior. IP addresses are processed to provide geographic insights and prevent bot activity. This data is used solely for internal analytics.</p>

                <p><strong>Vercel Analytics:</strong> Used to monitor page load speeds and technical stability. These services may use cookies or browser local storage to track unique sessions.</p>

                <h2>6. Cookies and Local Storage</h2>
                <ul>
                    <li><strong>Authentication:</strong> We use Privy for wallet-based authentication, which sets essential session cookies to verify wallet ownership.</li>
                    <li><strong>Preferences:</strong> Theme settings (dark/light mode) and UI preferences are stored locally in your browser to enhance your experience.</li>
                </ul>
                <p>We do not use cookies for targeted advertising or third-party marketing.</p>

                <h2>7. Data Storage and Transfers</h2>
                <p>
                    SOCI4L is a global service. Your data may be processed and stored by our third-party infrastructure providers (such as Vercel and Prisma) on servers located in various jurisdictions around the world. By using the Service, you acknowledge that your data may be transferred to and processed in countries other than your own.
                </p>

                <h2>8. Data Retention</h2>
                <ul>
                    <li><strong>Off-Chain Profiles:</strong> We retain your profile data as long as your account is active. If you request account deletion, off-chain data is typically removed within 30 days.</li>
                    <li><strong>Analytics Data:</strong> We retain analytics logs for a limited period (typically up to 14 months) necessary for operational analysis and security auditing.</li>
                    <li><strong>Blockchain Data:</strong> Data written to the blockchain is permanent and cannot be deleted or modified by SOCI4L.</li>
                </ul>

                <h2>9. Data Security</h2>
                <p>We implement commercially reasonable measures to protect off-chain data. However, users are solely responsible for the security of their own digital wallets. SOCI4L cannot recover funds or access for compromised wallets.</p>

                <h2>10. Your Rights</h2>
                <p>Depending on your location (e.g., EU/GDPR), you may have the right to request access to, correction of, or deletion of your off-chain personal data. Requests can be submitted to our contact email. Please note that we cannot fulfill requests to alter or erase blockchain-native data.</p>

                <h2>11. Contact</h2>
                <p>
                    For privacy-related inquiries:<br />
                    Email: <a href="mailto:hello@soci4l.net">hello@soci4l.net</a><br />
                    Website: <a href="https://soci4l.net">https://soci4l.net</a>
                </p>
            </div>
        </PageContent>
    )
}
