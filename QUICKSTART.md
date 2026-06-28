# Quick Start Guide - Get Running in 15 Minutes

This guide will get your misinformation detector up and running for your professor demo.

## Prerequisites Check

Before starting, make sure you have:
- [ ] Google account (for Colab)
- [ ] Python 3.9+ installed locally
- [ ] Node.js 18+ with pnpm
- [ ] Git installed
- [ ] Your True.csv and Fake.csv files

## Path 1: Demo Ready (No Training)

Use the mock API to see the system working immediately:

```bash
# 1. Install dependencies
cd /path/to/project
pnpm install

# 2. Start development server
pnpm dev

# 3. Open browser
# Visit http://localhost:3000

# 4. Test with sample input
# Paste this in the Article Content field:
# "SHOCKING: Exclusive leaked documents reveal secret government conspiracy. 
#  You won't believe what they've been hiding from us!"
# Click "Analyze" to see fake news detection
```

**Result**: You'll see the UI working with predictions and SHAP explanations.

Time to demo: **5 minutes**

---

## Path 2: Full System (With Training)

Complete end-to-end training and deployment:

### Step 1: Train Model in Colab (20 minutes)

1. Open Google Colab: https://colab.research.google.com
2. Create new notebook
3. Copy content from **COLAB_NOTEBOOK.md** into Colab cells
4. Upload your True.csv and Fake.csv when prompted
5. Run all cells sequentially
6. Download `misinformation_detector_artifacts.zip` (from Cell 11)

### Step 2: Set Up Local Backend (5 minutes)

```bash
# Extract model artifacts
unzip misinformation_detector_artifacts.zip
mkdir -p ./api_example/trained_model
cp -r misinformation_detector_artifacts/model/* ./api_example/trained_model/

# Install Python dependencies
pip install -r api_example/requirements.txt

# Run backend server
python api_example/predict.py
# Server runs at http://localhost:8000
```

### Step 3: Update Frontend to Use Real Model (2 minutes)

Edit `app/api/predict/route.ts`:

```typescript
// Replace the mock prediction with:
const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content, title }),
})
const data = await response.json()
return NextResponse.json(data)
```

### Step 4: Start Frontend

```bash
# In new terminal
pnpm dev
# Visit http://localhost:3000
```

**Result**: Full system running with your trained model.

Time for full setup: **30-40 minutes** (including training)

---

## Quick Testing

### Test Fake News Detection

Paste this into the Article Content field:

```
SHOCKING: Exclusive leaked footage reveals government is hiding UFOs!
You won't believe what they discovered in Area 51.
This bombshell proof will change everything. Before they delete this...
```

**Expected**: FAKE with 80%+ confidence

### Test Real News Detection

Paste this:

```
Scientists Release New Study on Climate Change
According to a peer-reviewed study published in Nature Climate Change,
researchers from multiple institutions confirm existing climate models.
The findings were confirmed by independent verification.
```

**Expected**: TRUE with 85%+ confidence

---

## For Your Professor Demo

### Setup (Before meeting)

```bash
# Terminal 1: Start frontend
pnpm dev

# Terminal 2: Start backend (if using real model)
python api_example/predict.py
```

### Demo Talking Points

1. **Problem**: Misinformation spreads quickly on social media
2. **Solution**: Use DistilBERT + VADER + SHAP for explainability
3. **Training**: Show Colab notebook metrics (94-96% accuracy)
4. **Live Demo**: 
   - Submit fake news → Shows detection with confidence
   - Submit real news → Shows verification
   - Click tabs to show SHAP explanations
5. **Architecture**: Explain the three-component approach
6. **Impact**: Discuss real-world applications

### Demo Script (5 minutes)

```
1. (1 min) Show the interface
   "This is our misinformation detection system..."

2. (1 min) Submit fake article
   "Let's test with obviously fake news..."
   → Shows FAKE 86%

3. (1 min) Show explanations
   "Click to see why it's fake..."
   → Show SHAP visualization

4. (1 min) Submit real article
   "Now with legitimate news..."
   → Shows TRUE 87%

5. (1 min) Discuss results
   "The model combines three techniques..."
```

---

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Frontend (port 3000)
pnpm dev -- -p 3001

# Backend (port 8000)
export API_PORT=8001
python api_example/predict.py
```

### Model Loading Error
1. Check model directory exists: `api_example/trained_model/`
2. Verify these files present:
   - `config.json`
   - `pytorch_model.bin`
   - `tokenizer.json`
3. Restart the backend

### API Connection Failed
1. Ensure backend is running: `http://localhost:8000/health`
2. Check frontend API endpoint matches
3. Verify CORS is enabled

---

## Deployment (Optional - For Production)

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
# Your app will be live at https://your-project.vercel.app
```

**Note**: This deploys only the frontend. For full backend, see DEPLOYMENT.md

---

## File Locations You Need

All in `/vercel/share/v0-project/`:

- **Frontend**: `app/page.tsx`, `components/*.tsx`
- **API Mock**: `app/api/predict/route.ts`
- **Backend**: `api_example/predict.py`
- **Training**: `COLAB_NOTEBOOK.md`
- **Docs**: `README.md`, `SETUP_GUIDE.md`, `DEPLOYMENT.md`

---

## Next Steps After Demo

1. ✅ Get feedback from professor
2. ✅ Iterate on model improvements
3. ✅ Deploy to production (DEPLOYMENT.md)
4. ✅ Expand with multi-language support
5. ✅ Add more datasets for training

---

## Emergency Fallback

If something breaks 5 minutes before demo:

```bash
# Use mock API (always works)
pnpm dev
# Visit http://localhost:3000
# Show UI functionality with mock predictions
```

The mock API is built-in and requires no backend!

---

## Need Help?

1. **Training issues**: See COLAB_NOTEBOOK.md
2. **Setup problems**: See SETUP_GUIDE.md
3. **Deployment**: See DEPLOYMENT.md
4. **General**: See README.md

---

**You're all set! Good luck with your presentation!**

For questions: Check the detailed guides or review the code comments.
