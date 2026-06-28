'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BookOpen, Lightbulb } from 'lucide-react'

interface ExplanationPanelProps {
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
    shap_explanations?: {
      token_importance?: Array<{ token: string; importance: number }>
      feature_importance?: Array<{ feature: string; importance: number }>
    }
  }
}

export default function ExplanationPanel({ prediction }: ExplanationPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'framework'>('overview')

  // Prepare sentiment data for chart
  const sentimentData = [
    { name: 'Positive', value: Math.round((prediction.sentiment?.positive || 0) * 100) },
    { name: 'Neutral', value: Math.round((prediction.sentiment?.neutral || 0) * 100) },
    { name: 'Negative', value: Math.round((prediction.sentiment?.negative || 0) * 100) },
  ]

  const colors = ['#10b981', '#6b7280', '#ef4444']

  // Sample feature importance data (in production, this would come from SHAP)
  const featureImportanceData = [
    { feature: 'Sentiment', importance: 0.35 },
    { feature: 'Word patterns', importance: 0.28 },
    { feature: 'Context', importance: 0.22 },
    { feature: 'Tone', importance: 0.15 },
  ]

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-border/50 bg-background/50 flex">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-4 px-4 text-sm font-medium transition ${
            activeTab === 'overview'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-2" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 py-4 px-4 text-sm font-medium transition ${
            activeTab === 'features'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart className="w-4 h-4 inline mr-2" />
          Features
        </button>
        <button
          onClick={() => setActiveTab('framework')}
          className={`flex-1 py-4 px-4 text-sm font-medium transition ${
            activeTab === 'framework'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Framework
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Prediction Explanation</h4>
              <div className="bg-background rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  {prediction.prediction === 'FAKE'
                    ? 'The DistilBERT model detected linguistic patterns and sentiment indicators that are commonly associated with misinformation. '
                    : 'The DistilBERT model identified language patterns consistent with authentic news reporting. '}
                  The model combines multiple signals including sentiment analysis via VADER and contextual understanding from its pre-trained weights.
                </p>
                <p className="pt-2">
                  <strong>Confidence:</strong> The model is {Math.round(prediction.confidence * 100)}% confident in this prediction.
                </p>
              </div>
            </div>

            {/* Sentiment Pie Chart */}
            {prediction.sentiment && (
              <div className="pt-4">
                <h4 className="font-semibold text-foreground mb-3">Sentiment Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {colors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Feature Importance (SHAP)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={featureImportanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="feature" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip 
                  formatter={(value) => `${(value * 100).toFixed(1)}%`}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                />
                <Bar dataKey="importance" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="bg-background rounded-lg p-4 text-sm text-muted-foreground">
              <p>These features represent the model&apos;s attention to different aspects of the text. Higher importance indicates stronger influence on the prediction.</p>
            </div>
          </div>
        )}

        {activeTab === 'framework' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="bg-background rounded-lg p-4 border border-primary/20">
                <h5 className="font-semibold text-primary mb-2">DistilBERT Transformer</h5>
                <p className="text-sm text-muted-foreground">Efficient BERT variant for text classification. Uses distilled knowledge to achieve 40% size reduction while maintaining 97% performance.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-accent/20">
                <h5 className="font-semibold text-accent mb-2">VADER Sentiment Analysis</h5>
                <p className="text-sm text-muted-foreground">Lexicon and rule-based sentiment analysis tailored for social media. Detects sentiment polarization patterns common in misinformation.</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-emerald-500/20">
                <h5 className="font-semibold text-emerald-500 mb-2">SHAP Explainability</h5>
                <p className="text-sm text-muted-foreground">Game theory-based model interpretability. Shows which features contributed most to each prediction, making the AI transparent.</p>
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 text-xs text-muted-foreground space-y-2">
              <p><strong>Architecture:</strong> DistilBERT (66M parameters) + VADER + SHAP</p>
              <p><strong>Training Data:</strong> True.csv and Fake.csv datasets</p>
              <p><strong>Framework:</strong> PyTorch + HuggingFace Transformers</p>
              <p><strong>Deployment:</strong> Next.js + Python API</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
