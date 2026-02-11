
import { PageContent } from "@/components/app-shell/page-content"

export default function TermsPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>Terms of Service</h1>
                <p className="text-muted-foreground italic">Last updated: February 11, 2026</p>

                <p>
                    Welcome to SOCI4L. By accessing or using our platform, connecting your digital wallet, or interacting with our services, you agree to be bound by these Terms of Service.
                </p>

                <h2>1. Acceptance of Terms</h2>
                <p>
                    SOCI4L provides a Web3 identity and profile management platform. By using the Service, you represent that you are of legal age and have the capacity to form a binding contract. If you do not agree to these terms, you must not access or use the Service.
                </p>

                <h2>2. Web3 Wallet and Security</h2>
                <p>
                    To use certain features of SOCI4L, you must connect a compatible digital wallet. You are solely responsible for:
                </p>
                <ul>
                    <li>Maintaining the security of your private keys, seed phrases, and wallet credentials.</li>
                    <li>All activities that occur under your connected wallet address.</li>
                    <li>Ensuring that your wallet is compatible with the Avalanche C-Chain.</li>
                </ul>
                <p>
                    SOCI4L never has access to your private keys and cannot recover access to your wallet if lost or compromised.
                </p>

                <h2>3. User-Generated Content</h2>
                <p>
                    You are responsible for the information you display on your public profile, including display names, bios, and social media links. You agree not to:
                </p>
                <ul>
                    <li>Post content that is illegal, defamatory, or infringes on third-party intellectual property.</li>
                    <li>Impersonate other individuals or entities.</li>
                    <li>Use the platform for malicious activities, including phishing or distributing malware.</li>
                </ul>

                <h2>4. Fees and Transactions</h2>
                <p>
                    Interactions with the blockchain may require the payment of gas fees (e.g., AVAX) to the network. These fees are not controlled by or paid to SOCI4L. Any premium features or services offered by SOCI4L will be subject to additional terms at the time of purchase.
                </p>

                <h2>5. Disclaimers and No Financial Advice</h2>
                <p>
                    The information provided on SOCI4L, including wallet balances and portfolio values, is for informational purposes only. SOCI4L does not provide financial, investment, or legal advice. Web3 and cryptocurrency involve significant risk; you should perform your own research before making any financial decisions.
                </p>

                <h2>6. Limitation of Liability</h2>
                <p>
                    SOCI4L is provided "as is" and "as available". We do not warrant that the Service will be uninterrupted or error-free. We are not liable for any losses resulting from blockchain network failures, smart contract bugs, wallet provider issues, or unauthorized access to your wallet.
                </p>

                <h2>7. Modifications to Service</h2>
                <p>
                    We reserve the right to modify or discontinue the Service at any time without notice. We may update these Terms from time to time by posting the new version on this page.
                </p>

                <h2>8. Governing Law</h2>
                <p>
                    These terms shall be governed by and construed in accordance with the laws applicable to decentralized digital services, without regard to conflict of law principles.
                </p>
            </div>
        </PageContent>
    )
}
