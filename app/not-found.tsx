import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription>Sayfa bulunamadı</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
          <Link href="/">
            <Button size="sm">Ana Sayfaya Dön</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
