# Misinformation Detection System - Complete Setup Guide

## Overview

This project combines:
- **DistilBERT** (Efficient BERT for text classification)
- **VADER** (Sentiment analysis)
- **SHAP** (Explainable AI)
- **Next.js** (Frontend & API)

## Phase 1: Model Training (Google Colab)

### Step 1: Prepare Your Colab Environment

1. Go to [Google Colab](https://colab.research.google.com)
2. Create a new notebook
3. Copy the **COLAB_NOTEBOOK.md** file content into your Colab cells
4. Run cells sequentially

### Step 2: Upload Datasets

When prompted in Cell 3:
1. Click the upload button
2. Select your `True.csv` and `Fake.csv` files
3. Wait for upload to complete

### Step 3: Train the Model

Run through Cell 7 to train DistilBERT:
- Takes approximately 15-20 minutes on GPU
- Uses 80/20 train-test split
- Trains for 3 epochs with evaluation

### Step 4: Download Model Artifacts

After Cell 11:
1. A file `misinformation_detector_artifacts.zip` will download
2. Extract it locally
3. Contains:
   - `model/` - DistilBERT weights and tokenizer
   - `metrics.json` - Performance metrics
   - `vader_config.json` - VADER configuration

## Phase 2: Frontend Setup

### Step 1: Install Dependencies

```bash
cd /path/to/project
pnpm install
```

### Step 2: Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the demo

## Phase 3: Integrate Trained Model

### Option A: Local Model Loading (Recommended for Development)

1. Create a `public/model/` directory
2. Copy your trained model files there
3. Update `app/api/predict/route.ts`:

```typescript
import { pipeline } from '@xenova/transformers'

let model: any = null

async function getModel() {
  if (!model) {
    model = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english')
  }
  return model
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title } = body
    
    const classifier = await getModel()
    const result = await classifier(content.substring(0, 512))
    
    // Process results...
    return NextResponse.json(prediction)
  } catch (error) {
    return NextResponse.json({ error: 'Prediction failed' }, { status: 500 })
  }
}
```

### Option B: Python Backend (Recommended for Production)

1. Create a Python service using FastAPI:

```bash
pip install fastapi uvicorn torch transformers vaderSentiment shap
```

2. Create `api/predict.py`:

```python
from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import torch
import shap

app = FastAPI()

# Load model
tokenizer = AutoTokenizer.from_pretrained('./trained_model')
model = AutoModelForSequenceClassification.from_pretrained('./trained_model')
analyzer = SentimentIntensityAnalyzer()

@app.post('/predict')
async def predict(content: str, title: str = ""):
    # Tokenize
    inputs = tokenizer.encode_plus(
        content,
        add_special_tokens=True,
        max_length=512,
        padding='max_length',
        truncation=True,
        return_tensors='pt'
    )
    
    # Predict
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=-1).cpu().numpy()[0]
    
    # Sentiment
    sentiment = analyzer.polarity_scores(content)
    
    return {
        'prediction': 'FAKE' if probs[0] > 0.5 else 'TRUE',
        'confidence': float(max(probs)),
        'probability_fake': float(probs[0]),
        'probability_true': float(probs[1]),
        'sentiment': {
            'positive': sentiment['pos'],
            'neutral': sentiment['neu'],
            'negative': sentiment['neg'],
            'compound': sentiment['compound']
        }
    }

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
```

3. Update `next.config.mjs` to use experimental services:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
    serverComponentsExternalPackages: ['transformers', 'torch'],
  },
};

export default nextConfig;
```

## Phase 4: SHAP Integration

### Add Token-Level Explanations

Update `app/api/predict/route.ts` to include SHAP:

```typescript
import shap

def get_shap_explanations(text: str, model, tokenizer):
    def predict_fn(texts):
        # Process texts and return predictions
        encodings = tokenizer(texts.tolist(), padding=True, truncation=True, max_length=512, return_tensors='pt')
        outputs = model(**encodings)
        return torch.nn.functional.softmax(outputs.logits, dim=-1).cpu().numpy()
    
    explainer = shap.Explainer(predict_fn, masker=shap.maskers.Text(tokenizer))
    shap_values = explainer([text])
    
    # Extract token importance
    tokens = tokenizer.tokenize(text)
    importance_scores = shap_values.values[0]
    
    return [{'token': token, 'importance': float(score)} 
            for token, score in zip(tokens, importance_scores)]
```

## Phase 5: Deployment to Vercel

### Step 1: Connect to GitHub

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository

### Step 2: Set Environment Variables

In Vercel Settings, add:
```
MODEL_PATH=./trained_model
PYTHON_API_URL=https://your-python-service.example.com
```

### Step 3: Deploy

```bash
vercel deploy --prod
```

## Phase 6: Demo for Professor

### Create a Presentation Notebook

1. **Slide 1**: Problem Statement
   - Misinformation spread on social media
   - Need for explainable AI solutions

2. **Slide 2**: Architecture
   - Show diagram: Data → DistilBERT → Predictions
   - Highlight VADER + SHAP components

3. **Slide 3**: Live Demo
   - Open the deployed website
   - Test with sample articles:
     - **Fake example**: "SHOCKING: Exclusive leaked footage reveals..."
     - **Real example**: "Scientists release new study confirming..."

4. **Slide 4**: Explainability
   - Show SHAP visualizations
   - Demonstrate token importance
   - Explain sentiment analysis

5. **Slide 5**: Results & Metrics
   - Show confusion matrix from Colab
   - Display accuracy, precision, recall, F1-score
   - Discuss model performance

### Testing Locally Before Demo

```bash
# Terminal 1: Start frontend
pnpm dev

# Terminal 2: Start Python API (if using Option B)
python api/predict.py

# Browser
# Visit http://localhost:3000
# Test with various articles
```

## Model Performance Metrics

After training in Colab, you'll see:
- **Accuracy**: Classification accuracy on test set
- **Precision**: True positives / all positive predictions
- **Recall**: True positives / all actual positives  
- **F1-Score**: Harmonic mean of precision and recall

Example expected values:
- Accuracy: 94-96%
- Precision: 93-95%
- Recall: 94-96%
- F1-Score: 94-95%

## Troubleshooting

### Model Not Loading
- Check `public/model/` directory exists
- Verify tokenizer files are present
- Check console for specific errors

### Predictions Taking Too Long
- Use quantized model for faster inference
- Implement caching with Redis
- Use batch processing if possible

### SHAP Errors
- Ensure transformers version >= 4.20
- Install shap separately: `pip install shap`
- Try with smaller input text (< 512 tokens)

## File Structure

```
project/
├── app/
│   ├── api/predict/route.ts        # Prediction endpoint
│   ├── page.tsx                     # Main page
│   ├── layout.tsx                   # Layout
│   └── globals.css                  # Styles
├── components/
│   ├── header.tsx
│   ├── article-form.tsx
│   ├── prediction-result.tsx
│   ├── loading-spinner.tsx
│   ├── explanation-panel.tsx        # SHAP explanations
│   └── ...
├── public/
│   └── model/                       # Trained model files
├── COLAB_NOTEBOOK.md               # Colab training code
└── SETUP_GUIDE.md                  # This file
```

## Next Steps

1. ✓ Create and run Colab notebook
2. ✓ Download model artifacts
3. ✓ Integrate model into API
4. ✓ Test locally with sample data
5. ✓ Deploy to Vercel
6. ✓ Present to professor

Good luck with your project!
