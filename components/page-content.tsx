'use client'

import { useState } from 'react'
import Header from '@/components/header'
import ArticleForm from '@/components/article-form'
import PredictionResult from '@/components/prediction-result'
import LoadingSpinner from '@/components/loading-spinner'
import ExplanationPanel from '@/components/explanation-panel'

export default function PageContent() {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)

  const handleSubmit = async (content: string, title: string) => {
    setLoading(true)
    setError('')
    setPrediction(null)
    setShowExplanation(false)

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, title }),
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const data = await response.json()
      setPrediction(data)
      setShowExplanation(true)
    } catch (err) {
      setError('Failed to analyze the article. Please try again.')
      console.error('Prediction error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1">
              <ArticleForm onSubmit={handleSubmit} isLoading={loading} />
            </div>

            {/* Results Section */}
            <div className="lg:col-span-2">
              {loading && <LoadingSpinner />}
              
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-foreground">
                  <p className="font-semibold mb-2">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {prediction && !loading && (
                <>
                  <PredictionResult prediction={prediction} />
                  
                  {showExplanation && (
                    <div className="mt-6">
                      <ExplanationPanel prediction={prediction} />
                    </div>
                  )}
                </>
              )}

              {!loading && !error && !prediction && (
                <div className="bg-card border border-border/50 rounded-lg p-12 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium mb-2">Submit an article to analyze</p>
                    <p className="text-sm">Enter news content on the left to detect if it&apos;s fake or real</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
