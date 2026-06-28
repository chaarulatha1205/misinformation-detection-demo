'use client'

import { FormEvent, useState } from 'react'
import { Send } from 'lucide-react'

interface ArticleFormProps {
  onSubmit: (content: string, title: string) => void
  isLoading: boolean
}

export default function ArticleForm({ onSubmit, isLoading }: ArticleFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content.trim(), title.trim())
    }
  }

  const handleClear = () => {
    setTitle('')
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-lg p-6 sticky top-24">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Article Title (Optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title..."
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
            Article Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the news article or paragraph here..."
            rows={8}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {content.length} characters
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            Analyze
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="px-4 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground font-medium rounded-md transition"
          >
            Clear
          </button>
        </div>

        <div className="pt-4 border-t border-border/30 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">About this tool:</p>
          <ul className="space-y-1">
            <li>✓ DistilBERT text classification</li>
            <li>✓ VADER sentiment analysis</li>
            <li>✓ SHAP explainability</li>
            <li>✓ Real-time predictions</li>
          </ul>
        </div>
      </div>
    </form>
  )
}
