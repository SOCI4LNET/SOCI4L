import { PublicLayout } from '@/components/public-layout/public-layout'

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicLayout>{children}</PublicLayout>
}
