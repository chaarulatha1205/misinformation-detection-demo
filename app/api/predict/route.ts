import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// This is a mock prediction function for demonstration
// In production, you would load the actual DistilBERT model and run inference
function mockPredict(content: string, title: string) {
  const text = (title + ' ' + content).toLowerCase()
  
  let fakeScore = 0.0

  // 1. SENSATIONALISM DETECTION (HIGH WEIGHT)
  const sensationalPatterns = [
    /!!!+/g, // Multiple exclamation marks
    /\?\?\?+/g, // Multiple question marks
    /!+\?+|!\?+!/g, // Mixed punctuation
  ]
  const punctuationCount = sensationalPatterns.reduce((count, pattern) => {
    const matches = text.match(pattern)
    return count + (matches ? matches.length : 0)
  }, 0)
  if (punctuationCount > 3) fakeScore += 0.25

  // 2. ALL CAPS WORDS (HIGH WEIGHT)
  const wordArray = text.split(/\s+/).filter(w => w.length > 0)
  const allCapsWords = wordArray.filter(w => /^[A-Z]{2,}$/.test(w))
  const capsRatio = wordArray.length > 0 ? allCapsWords.length / wordArray.length : 0
  if (capsRatio > 0.10) fakeScore += 0.22 // More than 10% all caps

  // 3. CLICKBAIT & SENSATIONALIST KEYWORDS (HIGHEST WEIGHT)
  const clickbaitKeywords = [
    'shocking', 'explosive', 'bombshell', 'unbelievable', 'you wont believe',
    'must watch', 'you won\'t believe', 'doctors hate', 'they don\'t want',
    'before they delete', 'they don\'t want you to know', 'hidden truth',
    'exclusive leaked', 'secret', 'exposed', 'revealed', 'this will shock you',
    'don\'t share', 'conspiracy', 'cover up', 'coverup', 'whistleblower',
    'insider reveals', 'disturbing', 'mind blowing', 'stunning', 'horrifying'
  ]
  const clickbaitCount = clickbaitKeywords.filter(kw => text.includes(kw)).length
  if (clickbaitCount >= 4) fakeScore += 0.32
  else if (clickbaitCount >= 2) fakeScore += 0.22
  else if (clickbaitCount >= 1) fakeScore += 0.12

  // 4. EMOTIONAL MANIPULATION (MEDIUM-HIGH WEIGHT)
  const emotionalWords = [
    'angry', 'furious', 'outraged', 'disgusted', 'appalled', 'heartbroken',
    'devastated', 'horrified', 'sickening', 'evil', 'monster', 'criminal',
    'scandal', 'shame', 'disgrace', 'betrayal', 'betrayed', 'abuse',
    'destroyed', 'ruined', 'poisoned', 'toxic', 'dangerous'
  ]
  const emotionalCount = emotionalWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`)
    return regex.test(text)
  }).length
  if (emotionalCount >= 3) fakeScore += 0.18
  else if (emotionalCount >= 1) fakeScore += 0.10

  // 5. LACK OF CREDIBLE SOURCES (MEDIUM WEIGHT)
  const credibleSources = [
    'according to', 'sources say', 'officials stated', 'government report',
    'research shows', 'study found', 'survey reveals', 'investigation found',
    'experts say', 'spokesman said', 'spokesperson', 'representative',
    'agency', 'organization', 'university', 'doctor', 'professor',
    'announced', 'confirmed', 'verified', 'authentic', 'reuters', 'bbc',
    'associated press', 'ap news'
  ]
  const sourceCount = credibleSources.filter(source => text.includes(source)).length
  if (sourceCount === 0) fakeScore += 0.15
  else if (sourceCount === 1) fakeScore += 0.05

  // 6. POOR GRAMMAR & SPELLING (LIGHT WEIGHT)
  // Check for common misspellings and poor grammar patterns
  const poorGrammarPatterns = [
    /your (instead of|insted|instd)/g,
    /their (instead of|insted)/g,
    /\balot\b/g,
    /\bdont \b/g,
    /\bwont \b/g,
    /\bcant \b/g,
  ]
  const grammarIssues = poorGrammarPatterns.reduce((count, pattern) => {
    const matches = text.match(pattern)
    return count + (matches ? matches.length : 0)
  }, 0)
  if (grammarIssues > 2) fakeScore += 0.10

  // 7. REAL NEWS INDICATORS - ONLY SIGNIFICANT REDUCTION
  // Only significantly reduce if multiple credible sources mentioned together
  const realNewsIndicators = [
    'according to', 'officials', 'government', 'research', 'study',
    'survey', 'investigation', 'expert', 'spokesman', 'representative',
    'agency', 'organization', 'confirmed', 'verified', 'statement',
    'report shows', 'data shows', 'evidence', 'fact check', 'source said',
    'announced', 'released', 'published', 'journal', 'institute'
  ]
  const realNewsCount = realNewsIndicators.filter(indicator => text.includes(indicator)).length
  // Only reduce if there are MULTIPLE credible indicators AND few fake signals
  if (realNewsCount >= 5 && fakeScore < 0.35) fakeScore = Math.max(0.05, fakeScore - 0.20)
  else if (realNewsCount >= 3 && fakeScore < 0.25) fakeScore = Math.max(0.10, fakeScore - 0.10)

  // Ensure score is between 0 and 1
  fakeScore = Math.max(0.05, Math.min(0.95, fakeScore))

  // Add minimal randomness for variety but keep predictions consistent
  const consistencyNoise = (Math.random() - 0.5) * 0.05
  const finalFakeScore = Math.max(0.0, Math.min(1.0, fakeScore + consistencyNoise))
  const finalTrueScore = 1 - finalFakeScore

  const isPredictionFake = finalFakeScore > 0.5

  // VADER SENTIMENT ANALYSIS (mock)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  let totalPositive = 0, totalNegative = 0, totalNeutral = 0

  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'brilliant', 'incredible', 'love', 'beautiful', 'best', 'perfect', 'success', 'achieved', 'thriving', 'progress']
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'evil', 'fail', 'failed', 'disaster', 'crisis', 'danger', 'dangerous', 'threat', 'problem', 'issue']

  sentences.forEach(sent => {
    const sentLower = sent.toLowerCase()
    const posCount = positiveWords.filter(w => sentLower.includes(w)).length
    const negCount = negativeWords.filter(w => sentLower.includes(w)).length
    
    const totalWords = sent.split(/\s+/).filter(w => w.length > 0).length
    if (totalWords > 0) {
      totalPositive += posCount / totalWords
      totalNegative += negCount / totalWords
    }
  })

  const avgSentenceCount = Math.max(sentences.length, 1)
  const sentimentPositive = Math.min(1, totalPositive / avgSentenceCount)
  const sentimentNegative = Math.min(1, totalNegative / avgSentenceCount)
  const sentimentNeutral = Math.max(0, 1 - sentimentPositive - sentimentNegative)

  // Generate SHAP-like explanations based on detected patterns
  const tokenImportance = []
  if (punctuationCount > 0) tokenImportance.push({ token: 'excessive punctuation', importance: 0.18 })
  if (allCapsWords.length > 0) tokenImportance.push({ token: 'ALL CAPS words', importance: 0.15 })
  if (clickbaitCount > 0) tokenImportance.push({ token: 'sensationalist words', importance: 0.20 })
  if (emotionalCount > 0) tokenImportance.push({ token: 'emotional language', importance: 0.12 })
  if (tokenImportance.length === 0) tokenImportance.push({ token: 'neutral tone', importance: 0.25 })

  return {
    prediction: isPredictionFake ? 'FAKE' : 'TRUE',
    confidence: isPredictionFake ? finalFakeScore : finalTrueScore,
    probability_fake: finalFakeScore,
    probability_true: finalTrueScore,
    sentiment: {
      positive: Math.max(0, Math.min(1, sentimentPositive)),
      negative: Math.max(0, Math.min(1, sentimentNegative)),
      neutral: Math.max(0, Math.min(1, sentimentNeutral)),
      compound: sentimentPositive - sentimentNegative,
    },
    shap_explanations: {
      token_importance: tokenImportance.slice(0, 5),
      feature_importance: [
        { feature: 'Sensationalism', importance: 0.25 },
        { feature: 'Emotional Language', importance: 0.20 },
        { feature: 'Credible Sources', importance: 0.20 },
        { feature: 'Clickbait Patterns', importance: 0.18 },
        { feature: 'Grammar Quality', importance: 0.17 },
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
