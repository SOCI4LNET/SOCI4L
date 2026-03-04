import { PageContent } from "@/components/app-shell/page-content"

export default function PrivacyExtensionPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>SOCI4L Donate Extension – Privacy Policy</h1>

                <p>
                    The SOCI4L Donate browser extension does not collect, store, or transmit any personal user data.
                </p>

                <p>
                    The extension operates only on X (Twitter) profile pages in order to detect supported profiles and display a SOCI4L donation button. This functionality allows users to send AVAX tips through the SOCI4L platform.
                </p>

                <p>
                    The extension does not track browsing activity, collect personal information, or store any user data.
                </p>

                <p>
                    All donation transactions are handled directly through the user's wallet and the SOCI4L platform.
                </p>

                <p>
                    The extension only reads publicly available page content necessary to render the donate button and does not access unrelated websites.
                </p>

                <p>
                    If you have any questions, you may contact:
                </p>
                <p>
                    <a href="mailto:hello@soci4l.net">hello@soci4l.net</a>
                </p>
            </div>
        </PageContent>
    )
}
