
import { PageContent } from "@/components/app-shell/page-content"

export default function TermsPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>Terms of Service</h1>
                <p className="text-muted-foreground italic">Last Updated: February 11, 2026</p>

                <p>
                    Welcome to SOCI4L (“SOCI4L”, “we”, “us”, “our”). These Terms of Service (“Terms”) govern your access to and use of the SOCI4L platform, including our website, dashboard, public profiles, smart contract integrations, and related services (collectively, the “Service”).
                </p>

                <p>
                    By accessing or using the Service, connecting a digital wallet, or interacting with SOCI4L smart contracts, you agree to be bound by these Terms.
                </p>

                <p className="font-bold">
                    If you do not agree, you must not use the Service.
                </p>

                <h2>1. Eligibility</h2>
                <p>You represent and warrant that:</p>
                <ul>
                    <li>You are at least 18 years old.</li>
                    <li>You have the legal capacity to enter into a binding agreement.</li>
                    <li>You are not subject to sanctions or located in a jurisdiction where use of the Service would be unlawful.</li>
                    <li>Your use of the Service does not violate any applicable laws or regulations.</li>
                </ul>

                <h2>2. Nature of the Service</h2>
                <p>SOCI4L provides a non-custodial Web3 identity and profile platform operating on the Avalanche C-Chain.</p>
                <p>SOCI4L:</p>
                <ul>
                    <li>Does not custody digital assets.</li>
                    <li>Is not a wallet provider.</li>
                    <li>Is not a broker, exchange, financial institution, or intermediary.</li>
                    <li>Does not execute trades or manage user funds.</li>
                </ul>
                <p>All blockchain interactions occur directly between your wallet and the Avalanche network.</p>

                <h2>3. Wallet Connection and Security</h2>
                <p>To use certain features, you must connect a compatible digital wallet.</p>
                <p>You are solely responsible for:</p>
                <ul>
                    <li>Safeguarding your private keys and seed phrases.</li>
                    <li>All activities conducted through your wallet address.</li>
                    <li>Reviewing and approving transactions before signing.</li>
                    <li>Ensuring wallet compatibility with Avalanche C-Chain.</li>
                </ul>
                <p>SOCI4L cannot access, recover, reset, or control your wallet credentials. All blockchain transactions are irreversible.</p>

                <h2>4. User-Generated Content</h2>
                <p>You are solely responsible for content displayed on your profile, including:</p>
                <ul>
                    <li>Display names, Biographies, Links, Images, Descriptions, and External references.</li>
                </ul>
                <p>You agree not to:</p>
                <ul>
                    <li>Post unlawful, defamatory, or infringing content.</li>
                    <li>Impersonate individuals or entities.</li>
                    <li>Engage in phishing, malware distribution, or fraudulent activity.</li>
                    <li>Use the Service for illegal purposes.</li>
                </ul>
                <p>We reserve the right to remove content or restrict access where violations occur.</p>

                <h2>5. Premium Features and Payments</h2>
                <p>SOCI4L may offer premium features purchasable via on-chain payment in AVAX.</p>
                <p>By purchasing premium access:</p>
                <ul>
                    <li>You acknowledge all payments are final and non-refundable.</li>
                    <li>You understand blockchain transactions cannot be reversed.</li>
                    <li>Premium access may be time-based or feature-based as described at purchase.</li>
                    <li>We reserve the right to modify, suspend, or discontinue any premium features at any time without prior notice.</li>
                </ul>
                <p>Gas fees are paid to the Avalanche network and are not controlled by SOCI4L. SOCI4L is not responsible for failed transactions caused by user error, insufficient gas, network congestion, or third-party wallet issues.</p>

                <h2>6. Intellectual Property</h2>
                <p>All platform content, including design, code, interface elements, branding, logos, trademarks, and documentation, are owned by SOCI4L or its licensors.</p>
                <p>You are granted a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes.</p>
                <p>You may not:</p>
                <ul>
                    <li>Reverse engineer the platform.</li>
                    <li>Copy, distribute, or exploit proprietary materials.</li>
                    <li>Use SOCI4L branding without authorization.</li>
                </ul>

                <h2>7. Experimental Technology Disclaimer</h2>
                <p>The Service relies on blockchain infrastructure, smart contracts, RPC providers, indexing services, and third-party wallet providers. These technologies may be experimental and subject to failure.</p>
                <p>SOCI4L does not guarantee uninterrupted availability, data accuracy, or error-free operation.</p>

                <h2>8. No Financial Advice</h2>
                <p>Information displayed on SOCI4L, including wallet balances, transaction history, and analytics, is provided for informational purposes only. SOCI4L does not provide investment, financial, legal, or tax advice. Digital assets involve significant risk. You are solely responsible for your decisions.</p>

                <h2>9. Assumption of Risk</h2>
                <p>By using the Service, you acknowledge and accept risks associated with:</p>
                <ul>
                    <li>Blockchain volatility</li>
                    <li>Smart contract vulnerabilities</li>
                    <li>Network congestion</li>
                    <li>Regulatory uncertainty</li>
                    <li>Wallet compromise</li>
                    <li>Third-party infrastructure failures</li>
                </ul>
                <p>You assume full responsibility for all blockchain-related risks.</p>

                <h2>10. Indemnification</h2>
                <p>You agree to indemnify and hold harmless SOCI4L and its operators from any claims, damages, liabilities, or expenses arising from:</p>
                <ul>
                    <li>Your use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of applicable law</li>
                    <li>Your infringement of third-party rights</li>
                </ul>

                <h2>11. Limitation of Liability</h2>
                <p>The Service is provided “as is” and “as available.” To the maximum extent permitted by applicable law, SOCI4L shall not be liable for:</p>
                <ul>
                    <li>Loss of digital assets</li>
                    <li>Lost profits</li>
                    <li>Data loss</li>
                    <li>Smart contract vulnerabilities</li>
                    <li>Wallet compromise</li>
                    <li>Network failures</li>
                    <li>Indirect or consequential damages</li>
                </ul>
                <p>Total liability shall not exceed the total amount paid by you to SOCI4L in the twelve (12) months preceding the claim.</p>

                <h2>12. Suspension and Termination</h2>
                <p>We reserve the right to suspend access, remove content, or disable accounts violating these Terms. Termination does not affect completed blockchain transactions.</p>

                <h2>13. Privacy</h2>
                <p>Your use of the Service is also governed by our Privacy Policy. Blockchain data is public by design. SOCI4L does not control public ledger visibility.</p>

                <h2>14. Modifications</h2>
                <p>We may update these Terms at any time. Continued use of the Service constitutes acceptance of revised Terms.</p>

                <h2>15. Severability</h2>
                <p>If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect.</p>

                <h2>16. Contact</h2>
                <p>
                    For questions regarding these Terms:<br />
                    Email: <a href="mailto:hello@soci4l.net">hello@soci4l.net</a><br />
                    Website: <a href="https://soci4l.net">https://soci4l.net</a>
                </p>
            </div>
        </PageContent>
    )
}
