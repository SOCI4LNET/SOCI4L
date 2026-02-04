
import { PageContent } from "@/components/app-shell/page-content"

export default function TermsPage() {
    return (
        <PageContent>
            <div className="prose dark:prose-invert max-w-none">
                <h1>Terms of Service</h1>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                    Welcome to SOCI4L. By accessing or using our platform, you agree to be bound by these Terms of Service.
                </p>
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <h2>2. Use License</h2>
                <p>
                    Permission is granted to temporarily download one copy of the materials (information or software) on SOCI4L's website for personal, non-commercial transitory viewing only.
                </p>
                <h2>3. Disclaimer</h2>
                <p>
                    The materials on SOCI4L's website are provided "as is". SOCI4L makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
                </p>
            </div>
        </PageContent>
    )
}
