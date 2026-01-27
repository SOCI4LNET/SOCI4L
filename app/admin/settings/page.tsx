import { PageShell } from '@/components/app-shell/page-shell'

// Force dynamic rendering since this page reads environment variables
export const dynamic = 'force-dynamic'

const adminAddresses = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
  .split(',')
  .map((a) => a.trim())
  .filter(Boolean)

export default function AdminSettingsPage() {
  return (
    <PageShell
      title="Settings"
      subtitle="Admin configuration for SOCI4L."
      mode="constrained"
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Admin wallets (read-only)</h2>
          <p className="text-xs text-muted-foreground">
            These wallet addresses are allowed to access the admin panel. To change them, update
            the NEXT_PUBLIC_ADMIN_ADDRESSES environment variable in Vercel.
          </p>
          <div className="rounded-md border bg-card p-3 text-xs font-mono space-y-1">
            {adminAddresses.length === 0 ? (
              <span className="text-muted-foreground">No admin addresses configured.</span>
            ) : (
              adminAddresses.map((addr) => <div key={addr}>{addr}</div>)
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">Feature flags</h2>
          <p className="text-xs text-muted-foreground">
            In the future, feature flags such as demo mode, beta features, or experimental
            analytics will be controlled from here.
          </p>
        </section>
      </div>
    </PageShell>
  )
}

