import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// This is a mock prediction function for demonstration
// In production, you would load the actual DistilBERT model and run inference
function mockPredict(content: string, title: string) {
  const text = (title + ' ' + content).toLowerCase()
  
  let fakeScore = 0.0

  // 1. SENSATIONALISM DETECTION (HIGH WEIGHT: +0.25)
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

  // 2. ALL CAPS WORDS (HIGH WEIGHT: +0.22)
  const wordArray = text.split(/\s+/).filter(w => w.length > 0)
  const allCapsWords = wordArray.filter(w => /^[A-Z]{2,}$/.test(w))
  const capsRatio = wordArray.length > 0 ? allCapsWords.length / wordArray.length : 0
  if (capsRatio > 0.10) fakeScore += 0.22

  // 3. CLICKBAIT & SENSATIONALIST KEYWORDS (HIGHEST WEIGHT: +0.32)
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

  // 4. EMOTIONAL MANIPULATION (MEDIUM-HIGH WEIGHT: +0.18)
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

  // 5. ABSURD/IMPLAUSIBLE CLAIMS (VERY HIGH WEIGHT: +0.45)
  // Expanded to catch more types of ridiculous claims
  const absurdClaimsPatterns = [
    // Animal behavior nonsense
    /cat[s]?.*speak.*language/i,
    /dog[s]?.*talk.*english/i,
    /animal[s]?.*communicate.*fluent/i,
    /implanted.*chip[s]?.*speak/i,
    /trained.*pet[s]?.*fluent/i,
    // Substance/composition absurdities
    /moon.*composed.*cheese/i,
    /moon.*entirely.*cheese/i,
    /cheese.*moon/i,
    // Medical miracles
    /miracle.*cure/i,
    /cure[s]?.*(?:all|any).*(?:disease|cancer|illness|condition)/i,
    /cure.*all.*cancer/i,
    /immortality.*serum/i,
    /eliminates.*all.*cancer/i,
    /100%.*(?:success|cure|recovery)/i,
    // Conspiracy nonsense
    /secret.*government.*alien/i,
    /alien.*government.*technology/i,
    // Impossible physics
    /lost.*technology.*time.*travel/i,
    /scientist[s]?.*discover.*perpetual.*motion/i,
    /scientist[s]?.*create.*perpetual/i,
    /water.*into.*gold/i,
    /human[s]?.*grow.*wing[s]?/i,
    /human[s]?.*develop.*flight/i,
    // Mind control
    /mind.*control.*technology.*chips/i,
    /mind.*control.*implant/i,
    /remote.*control.*humans/i,
    // Hidden evidence patterns
    /deliberately.*hidden.*public/i,
    /hidden.*deliberately/i,
    /covered.*up.*public/i,
  ]
  const absurdClaims = absurdClaimsPatterns.filter(pattern => pattern.test(text)).length
  if (absurdClaims > 0) fakeScore += 0.45

  // 5b. CHECK IF EXPERTS DISMISSED THE CLAIM (HOAX PATTERN: +0.15)
  // Hoaxes often mention experts dismissing them to seem credible
  const dismissalPatterns = [
    /experts? (?:dismissed|denied|debunked|refuted)/i,
    /(?:dismissed|denied|debunked|refuted).*(?:unsupported|false|hoax|fake|fabricated)/i,
    /(?:unsupported|false|fabricated|hoax).*scientific evidence/i,
  ]
  const dismissalFound = dismissalPatterns.filter(pattern => pattern.test(text)).length
  if (absurdClaims > 0 && dismissalFound > 0) {
    fakeScore += 0.15
  }

  // 6. VAGUE/UNVERIFIABLE CLAIMS (MEDIUM WEIGHT: +0.20)
  const vaguePatterns = [
    /claim[s]?.*that.*(?:study|research).*proven/i,
    /report.*allege[s]?.*that/i,
    /reportedly.*found/i,
    /allegedly/i,
    /online article claims/i,
    /some say/i,
    /it is said/i,
    /researchers.*have.*discovered.*shocking/i,
    /breakthrough.*contradicts.*(?:everything|all|established)/i,
    /proof.*that.*contradicts/i,
  ]
  const vagueCount = vaguePatterns.filter(pattern => pattern.test(text)).length
  if (vagueCount >= 2) fakeScore += 0.20
  else if (vagueCount >= 1) fakeScore += 0.15

  // 7. LACK OF CREDIBLE SOURCES (MEDIUM WEIGHT: +0.15)
  const credibleSources = [
    'according to', 'sources say', 'officials stated', 'government report',
    'research shows', 'study found', 'survey reveals', 'investigation found',
    'experts say', 'spokesman said', 'spokesperson', 'representative',
    'agency', 'organization', 'university', 'doctor', 'professor',
    'announced', 'confirmed', 'verified', 'authentic', 'reuters', 'bbc',
    'associated press', 'ap news', 'named university', 'named researcher'
  ]
  const sourceCount = credibleSources.filter(source => text.includes(source)).length
  if (sourceCount === 0) fakeScore += 0.15
  else if (sourceCount === 1) fakeScore += 0.05

  // 7b. COMBINED: VAGUE CLAIMS + NO CREDIBLE SOURCES = STRONG FAKE SIGNAL
  if (vagueCount >= 2 && sourceCount === 0) {
    fakeScore += 0.15 // Additional boost for this dangerous combination
  }

  // 8. POOR GRAMMAR & SPELLING (LIGHT WEIGHT: +0.10)
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

  // 9. REAL NEWS INDICATORS - CONSERVATIVE REDUCTION
  // Only reduce score if there are STRONG credible signals
  const realNewsIndicators = [
    'according to', 'officials', 'government', 'research', 'study',
    'survey', 'investigation', 'expert', 'spokesman', 'representative',
    'agency', 'organization', 'confirmed', 'verified', 'statement',
    'report shows', 'data shows', 'evidence', 'fact check', 'source said',
    'announced', 'released', 'published', 'journal', 'institute'
  ]
  const realNewsCount = realNewsIndicators.filter(indicator => text.includes(indicator)).length
  
  // Only reduce if MANY credible indicators AND NO absurd claims
  if (absurdClaims === 0 && realNewsCount >= 6) {
    fakeScore = Math.max(0.10, fakeScore - 0.25)
  } else if (absurdClaims === 0 && realNewsCount >= 4) {
    fakeScore = Math.max(0.15, fakeScore - 0.15)
  }

  // Ensure score is between 0.05 and 0.95
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
  if (absurdClaims > 0) tokenImportance.push({ token: 'absurd/implausible claims', importance: 0.30 })
  if (punctuationCount > 0) tokenImportance.push({ token: 'excessive punctuation', importance: 0.18 })
  if (allCapsWords.length > 0) tokenImportance.push({ token: 'ALL CAPS words', importance: 0.15 })
  if (clickbaitCount > 0) tokenImportance.push({ token: 'sensationalist words', importance: 0.20 })
  if (emotionalCount > 0) tokenImportance.push({ token: 'emotional language', importance: 0.12 })
  if (vagueCount > 0) tokenImportance.push({ token: 'vague claims', importance: 0.14 })
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
