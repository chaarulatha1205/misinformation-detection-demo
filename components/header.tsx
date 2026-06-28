import { Brain, Zap } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Misinformation Detector</h1>
              <p className="text-sm text-muted-foreground">By CHAARULATHA J (22MID0317)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-accent">SHAP Explainability</span>
          </div>
        </div>
      </div>
    </header>
  )
}
