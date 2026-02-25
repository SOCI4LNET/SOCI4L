import { PublicLayout } from '@/components/public-layout/public-layout'

export default function TestProfileLayoutWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    return <PublicLayout>{children}</PublicLayout>
}
