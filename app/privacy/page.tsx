
import { PageContent } from "@/components/app-shell/page-content"

export default function PrivacyPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>Privacy Policy</h1>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                    Your privacy is important to us. It is SOCI4L's policy to respect your privacy regarding any information we may collect from you across our website.
                </p>
                <h2>1. Information We Collect</h2>
                <p>
                    We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
                </p>
                <h2>2. How We Store Data</h2>
                <p>
                    We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means.
                </p>
                <h2>3. Public Blockchain Data</h2>
                <p>
                    Please note that data written to the blockchain is public and permanent. We have no control over data once it is on the blockchain.
                </p>
            </div>
        </PageContent>
    )
}
