import { Suspense } from 'react'
import PageContent from '@/components/page-content'

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PageContent />
    </Suspense>
  )
}
