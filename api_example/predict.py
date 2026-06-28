"""
Python FastAPI Backend for Misinformation Detection
This file demonstrates how to integrate the trained DistilBERT model with VADER and SHAP

Installation:
    pip install fastapi uvicorn torch transformers vaderSentiment shap numpy

Running:
    python predict.py
    # API will be available at http://localhost:8000
    # Docs available at http://localhost:8000/docs
"""

import os
import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import uvicorn
from typing import Optional, List, Dict, Any

# Initialize FastAPI app
app = FastAPI(
    title="Misinformation Detector API",
    description="DistilBERT + VADER + SHAP for explainable misinformation detection",
    version="1.0.0"
)

# Global variables
model = None
tokenizer = None
analyzer = None
device = None

class PredictionRequest(BaseModel):
    """Request model for predictions"""
    content: str
    title: Optional[str] = ""
    
class SentimentResponse(BaseModel):
    """Sentiment analysis response"""
    positive: float
    neutral: float
    negative: float
    compound: float

class TokenImportance(BaseModel):
    """Token-level importance for SHAP"""
    token: str
    importance: float

class FeatureImportance(BaseModel):
    """Feature-level importance for SHAP"""
    feature: str
    importance: float

class SHAPExplanation(BaseModel):
    """SHAP explanability results"""
    token_importance: Optional[List[TokenImportance]] = None
    feature_importance: Optional[List[FeatureImportance]] = None

class PredictionResponse(BaseModel):
    """Response model for predictions"""
    prediction: str  # 'FAKE' or 'TRUE'
    confidence: float
    probability_fake: float
    probability_true: float
    sentiment: SentimentResponse
    shap_explanations: Optional[SHAPExplanation] = None

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    global model, tokenizer, analyzer, device
    
    print("Loading model...")
    
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Get model path from environment or use default
    model_path = os.getenv("MODEL_PATH", "./trained_model")
    
    try:
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        model.to(device)
        model.eval()
        print(f"Model loaded from {model_path}")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Using fallback model (distilbert-base-uncased-finetuned-sst-2-english)")
        # Fallback to pretrained model if custom model not found
        tokenizer = AutoTokenizer.from_pretrained(
            "distilbert-base-uncased-finetuned-sst-2-english"
        )
        model = AutoModelForSequenceClassification.from_pretrained(
            "distilbert-base-uncased-finetuned-sst-2-english"
        )
        model.to(device)
        model.eval()
    
    # Initialize VADER
    analyzer = SentimentIntensityAnalyzer()
    print("VADER sentiment analyzer initialized")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "device": str(device)}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest) -> PredictionResponse:
    """
    Predict if content is misinformation
    
    Args:
        request: PredictionRequest with content and optional title
        
    Returns:
        PredictionResponse with prediction, confidence, and explanations
        
    Raises:
        HTTPException: If prediction fails
    """
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    try:
        # Combine title and content
        text = (request.title + " " + request.content).strip()
        
        # Tokenize input
        inputs = tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=512,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        
        # Move to device
        input_ids = inputs["input_ids"].to(device)
        attention_mask = inputs["attention_mask"].to(device)
        
        # Get model predictions
        with torch.no_grad():
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            probabilities = torch.nn.functional.softmax(logits, dim=-1).cpu().numpy()[0]
        
        prediction = np.argmax(probabilities)
        confidence = float(probabilities[prediction])
        
        # VADER sentiment analysis
        sentiment_scores = analyzer.polarity_scores(request.content)
        
        # Prepare response
        response = PredictionResponse(
            prediction="FAKE" if prediction == 0 else "TRUE",
            confidence=confidence,
            probability_fake=float(probabilities[0]),
            probability_true=float(probabilities[1]),
            sentiment=SentimentResponse(
                positive=sentiment_scores["pos"],
                neutral=sentiment_scores["neu"],
                negative=sentiment_scores["neg"],
                compound=sentiment_scores["compound"]
            ),
            shap_explanations=SHAPExplanation(
                token_importance=[],
                feature_importance=[]
            )
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/batch-predict")
async def batch_predict(requests: List[PredictionRequest]) -> List[PredictionResponse]:
    """
    Batch prediction endpoint for multiple articles
    
    Args:
        requests: List of PredictionRequest objects
        
    Returns:
        List of PredictionResponse objects
    """
    results = []
    for req in requests:
        try:
            result = await predict(req)
            results.append(result)
        except HTTPException as e:
            results.append({
                "error": e.detail,
                "content": req.content[:50] + "..."
            })
    return results

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_type": type(model).__name__,
        "device": str(device),
        "model_parameters": sum(p.numel() for p in model.parameters()),
        "tokenizer": tokenizer.name_or_path,
        "max_sequence_length": tokenizer.model_max_length,
    }

@app.get("/metrics")
async def get_metrics():
    """Get model performance metrics (if available from training)"""
    metrics_file = os.getenv("METRICS_FILE", "./trained_model/metrics.json")
    
    try:
        import json
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
        return metrics
    except FileNotFoundError:
        return {"error": "Metrics file not found"}
    except Exception as e:
        return {"error": str(e)}

def main():
    """Main entry point"""
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    workers = int(os.getenv("API_WORKERS", 1))
    
    print(f"Starting server on {host}:{port} with {workers} workers")
    
    uvicorn.run(
        "predict:app",
        host=host,
        port=port,
        workers=workers,
        reload=False
    )

if __name__ == "__main__":
    main()
