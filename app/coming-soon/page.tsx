import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Çok Yakında
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Üzerinde çalışıyoruz. Kısa süre içinde sizlerle olacağız.
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500">
          <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-pulse" />
          <span>Hazırlanıyor...</span>
        </div>
      </div>
    </div>
  )
}
