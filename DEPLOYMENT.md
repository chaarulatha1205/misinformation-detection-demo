# Deployment Guide - Misinformation Detection System

Complete guide for deploying the misinformation detector to production.

## Architecture Overview

```
┌─────────────────────┐
│  Next.js Frontend   │  (Vercel)
│  - React UI         │
│  - Charts/Visualize │
│  - SHAP Displays    │
└──────────┬──────────┘
           │ API calls
           ↓
┌──────────────────────┐
│  Python Backend      │  (Docker/Railway/Heroku)
│  - FastAPI Server    │
│  - DistilBERT Model  │
│  - VADER Analysis    │
│  - SHAP Explanations │
└──────────┬───────────┘
           │ Loads
           ↓
┌──────────────────────┐
│  Model Artifacts     │  (Storage)
│  - Trained weights   │
│  - Tokenizer        │
│  - Config files      │
└──────────────────────┘
```

## Prerequisites

- Docker installed
- Python 3.9+
- Git
- Account on deployment platform (Vercel, Railway, Heroku, etc.)

## Step 1: Prepare Model Artifacts

### From Google Colab

1. Complete the training notebook (COLAB_NOTEBOOK.md)
2. Download `misinformation_detector_artifacts.zip`
3. Extract and verify contents:
   ```
   misinformation_detector_artifacts/
   ├── model/
   │   ├── config.json
   │   ├── pytorch_model.bin
   │   ├── tokenizer.json
   │   ├── vocab.txt
   │   └── special_tokens_map.json
   ├── metrics.json
   └── vader_config.json
   ```

4. Create directory in project:
   ```bash
   mkdir -p ./api_example/trained_model
   cp -r misinformation_detector_artifacts/model/* ./api_example/trained_model/
   ```

## Step 2: Create Docker Image

### Dockerfile for Backend

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY api_example/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api_example/ .
COPY trained_model/ ./trained_model/

# Expose port
EXPOSE 8000

# Set environment variables
ENV MODEL_PATH=/app/trained_model
ENV API_HOST=0.0.0.0
ENV API_PORT=8000

# Run application
CMD ["python", "predict.py"]
```

### Build and Test Locally

```bash
docker build -t misinformation-detector-api .
docker run -p 8000:8000 misinformation-detector-api
```

Visit `http://localhost:8000/docs` to test the API.

## Step 3: Deploy Backend

### Option A: Railway

1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Create new service
4. Select Docker as build method
5. Set environment variables:
   - `MODEL_PATH=/app/trained_model`
   - `API_WORKERS=4`
6. Deploy

Railway will automatically build and deploy your Docker image.

### Option B: Heroku

```bash
# Install Heroku CLI
curl https://cli.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create misinformation-detector-api

# Set buildpack
heroku buildpacks:set heroku/python

# Set environment variables
heroku config:set MODEL_PATH=/app/trained_model

# Deploy
git push heroku main
```

### Option C: AWS Lambda + ECR

1. Create ECR repository:
   ```bash
   aws ecr create-repository --repository-name misinformation-detector
   ```

2. Push Docker image:
   ```bash
   docker tag misinformation-detector-api:latest \
     <account>.dkr.ecr.<region>.amazonaws.com/misinformation-detector:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/misinformation-detector:latest
   ```

3. Create Lambda function from ECR image
4. Set memory to 3GB+ for model loading
5. Set timeout to 60+ seconds

### Option D: Google Cloud Run

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/misinformation-detector

# Deploy
gcloud run deploy misinformation-detector \
  --image gcr.io/YOUR_PROJECT_ID/misinformation-detector \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --timeout 60
```

## Step 4: Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Create new project from GitHub repository
4. Set build and output settings:
   - Build command: `pnpm build`
   - Output directory: `.next`
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
6. Deploy

## Step 5: Update API Endpoint in Frontend

### Update next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
```

### Update app/page.tsx

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

const response = await fetch(`${API_URL}/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content, title }),
})
```

## Step 6: Production Checklist

- [ ] Model loads correctly in production
- [ ] API responds to predictions
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Error logging enabled
- [ ] Database backups (if used)
- [ ] SSL/HTTPS enabled
- [ ] Monitoring and alerts set up
- [ ] Load balancing configured (if needed)
- [ ] CDN configured for static assets

## Performance Optimization

### Model Optimization

```python
# Use quantization for faster inference
from transformers import AutoTokenizer
import torch

model = AutoModelForSequenceClassification.from_pretrained('./trained_model')

# Quantize model
quantized_model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)

quantized_model.save_pretrained('./trained_model_quantized')
```

### Caching

Add Redis for caching frequent predictions:

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@app.post("/predict")
async def predict(request: PredictionRequest):
    # Check cache
    cache_key = f"pred:{hash(request.content)}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Generate prediction
    result = generate_prediction(request)
    
    # Cache for 24 hours
    redis_client.setex(cache_key, 86400, json.dumps(result))
    
    return result
```

## Monitoring

### Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/predict")
async def predict(request: PredictionRequest):
    logger.info(f"Prediction request: {len(request.content)} chars")
    # ... prediction logic ...
    logger.info(f"Result: {result.prediction} ({result.confidence:.2%})")
```

### Metrics

Use Prometheus for metrics:

```python
from prometheus_client import Counter, Histogram, generate_latest

prediction_counter = Counter('predictions_total', 'Total predictions', ['result'])
prediction_time = Histogram('prediction_time_seconds', 'Prediction time')

@app.post("/predict")
@prediction_time.time()
async def predict(request: PredictionRequest):
    result = generate_prediction(request)
    prediction_counter.labels(result=result.prediction).inc()
    return result

@app.get("/metrics")
async def metrics():
    return generate_latest()
```

## Troubleshooting

### Model takes too long to load
- Ensure sufficient disk space
- Pre-load model on container start
- Consider using smaller model variant

### Out of memory errors
- Increase container memory
- Use model quantization
- Implement request queuing

### Slow predictions
- Enable GPU
- Use batch processing
- Implement caching
- Optimize tokenizer

## Scaling

### Horizontal Scaling

Deploy multiple instances with load balancing:

```yaml
# Docker Compose for multiple workers
version: '3'
services:
  api:
    build: .
    environment:
      - API_WORKERS=4
    deploy:
      replicas: 3
    ports:
      - "8000"
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Vertical Scaling

Increase single instance resources:
- More CPU cores
- More RAM
- GPU acceleration

## Cost Optimization

- Use free tier deployments (Railway, Vercel free tier)
- Implement caching to reduce repeated inferences
- Use spot instances for non-critical services
- Monitor usage and optimize resource allocation

## Security Considerations

1. **API Authentication**: Add API key validation
   ```python
   from fastapi.security import HTTPBearer, HTTPAuthCredentials
   
   security = HTTPBearer()
   
   @app.post("/predict")
   async def predict(request: PredictionRequest, credentials: HTTPAuthCredentials = Depends(security)):
       # Validate API key
       if credentials.credentials != os.getenv("API_KEY"):
           raise HTTPException(status_code=401, detail="Invalid credentials")
   ```

2. **Rate Limiting**:
   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   
   @app.post("/predict")
   @limiter.limit("100/minute")
   async def predict(request: PredictionRequest):
       ...
   ```

3. **CORS Configuration**:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

## Backup and Recovery

1. Version control for code (GitHub)
2. Export model regularly to stable storage
3. Document deployment process
4. Test recovery procedures

## Next Steps

1. Test end-to-end flow in production
2. Monitor performance metrics
3. Gather user feedback
4. Iterate and improve
5. Plan for scaling as needed

---

For questions or issues, refer to SETUP_GUIDE.md or create an issue on GitHub.
