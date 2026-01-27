import { PublicLayout } from '@/components/public-layout/public-layout'

export default function ProfileLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicLayout>{children}</PublicLayout>
}
