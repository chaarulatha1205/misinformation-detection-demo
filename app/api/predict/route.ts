import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// This is a mock prediction function for demonstration
// In production, you would load the actual DistilBERT model and run inference
function mockPredict(content: string, title: string) {
  // Simple heuristic for demonstration
  const text = (title + ' ' + content).toLowerCase()
  
  // Keywords commonly found in fake news
  const fakeKeywords = [
    'shocking', 'fake', 'hoax', 'conspiracy', 'unbelievable',
    'exclusive', 'breaking', 'leaked', 'bombshell', 'exposed',
    'hidden', 'secret', 'must watch', 'they dont want you to know',
    'before they delete', 'proof', 'you won\'t believe'
  ]
  
  // Keywords in real news
  const realKeywords = [
    'according to', 'officials', 'statement', 'confirmed',
    'sources said', 'investigation', 'research', 'study',
    'report shows', 'data', 'survey', 'expert',
    'spokesman', 'representative', 'spokesperson'
  ]

  const fakeCount = fakeKeywords.filter(kw => text.includes(kw)).length
  const realCount = realKeywords.filter(kw => text.includes(kw)).length

  // Calculate probabilities
  const totalScore = fakeCount + realCount
  const fakeScore = totalScore > 0 ? fakeCount / (totalScore + 2) : 0.3
  const realScore = 1 - fakeScore

  // Add some randomness for demo purposes
  const noise = (Math.random() - 0.5) * 0.1
  const adjustedFakeScore = Math.max(0.1, Math.min(0.9, fakeScore + noise))
  const adjustedRealScore = 1 - adjustedFakeScore

  const isPredictionFake = adjustedFakeScore > 0.5

  // VADER sentiment (mock)
  const sentenceSentiment = text.split(/[.!?]/).map(sent => {
    const positive = ['good', 'great', 'excellent', 'amazing', 'wonderful'].some(w => sent.includes(w)) ? 0.4 : 0
    const negative = ['bad', 'terrible', 'awful', 'horrible', 'worst'].some(w => sent.includes(w)) ? 0.4 : 0
    return { pos: positive, neg: negative }
  })

  const avgPositive = sentenceSentiment.reduce((a, s) => a + s.pos, 0) / Math.max(sentenceSentiment.length, 1)
  const avgNegative = sentenceSentiment.reduce((a, s) => a + s.neg, 0) / Math.max(sentenceSentiment.length, 1)
  const avgNeutral = 1 - avgPositive - avgNegative

  return {
    prediction: isPredictionFake ? 'FAKE' : 'TRUE',
    confidence: isPredictionFake ? adjustedFakeScore : adjustedRealScore,
    probability_fake: adjustedFakeScore,
    probability_true: adjustedRealScore,
    sentiment: {
      positive: Math.max(0, Math.min(1, avgPositive)),
      negative: Math.max(0, Math.min(1, avgNegative)),
      neutral: Math.max(0, Math.min(1, avgNeutral)),
      compound: avgPositive - avgNegative,
    },
    shap_explanations: {
      token_importance: [
        { token: 'shocking', importance: 0.15 },
        { token: 'exclusive', importance: 0.12 },
        { token: 'unbelievable', importance: 0.10 },
      ],
      feature_importance: [
        { feature: 'Sentiment', importance: 0.35 },
        { feature: 'Word patterns', importance: 0.28 },
        { feature: 'Context', importance: 0.22 },
        { feature: 'Tone', importance: 0.15 },
      ],
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual model inference
    // In production:
    // 1. Load the trained DistilBERT model from /api/models/distilbert/
    // 2. Tokenize the input using the model's tokenizer
    // 3. Run inference with torch
    // 4. Generate SHAP explanations
    // 5. Analyze sentiment with VADER
    
    const prediction = mockPredict(content, title || '')

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to process prediction' },
      { status: 500 }
    )
  }
}
