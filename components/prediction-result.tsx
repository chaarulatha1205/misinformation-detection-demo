'use client'

import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'

interface PredictionResultProps {
  prediction: {
    prediction: string
    confidence: number
    probability_fake: number
    probability_true: number
    sentiment?: {
      negative: number
      neutral: number
      positive: number
      compound: number
    }
  }
}

export default function PredictionResult({ prediction }: PredictionResultProps) {
  const isFake = prediction.prediction === 'FAKE'
  const confidence = Math.round(prediction.confidence * 100)

  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <div
        className={`rounded-lg border-2 p-6 ${
          isFake
            ? 'bg-destructive/10 border-destructive/50'
            : 'bg-emerald-500/10 border-emerald-500/50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              isFake
                ? 'bg-destructive/20'
                : 'bg-emerald-500/20'
            }`}
          >
            {isFake ? (
              <AlertTriangle className="w-6 h-6 text-destructive" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">
                {prediction.prediction}
              </span>
              <span className="text-xl font-semibold text-muted-foreground">
                {confidence}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isFake
                ? 'This article shows characteristics of misinformation'
                : 'This article appears to be from a reliable news source'
              }
            </p>

            {/* Confidence Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fake</span>
                <span>Real</span>
              </div>
              <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-destructive to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${prediction.probability_true * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-foreground">
                <span>{Math.round(prediction.probability_fake * 100)}%</span>
                <span>{Math.round(prediction.probability_true * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      {prediction.sentiment && (
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Sentiment Analysis (VADER)</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(prediction.sentiment.positive * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Positive</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(prediction.sentiment.neutral * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Neutral</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(prediction.sentiment.negative * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Negative</div>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold ${
                prediction.sentiment.compound > 0 ? 'text-emerald-500' : 
                prediction.sentiment.compound < 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {prediction.sentiment.compound.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Compound</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
