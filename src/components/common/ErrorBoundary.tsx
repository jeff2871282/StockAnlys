import { Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex items-start gap-2 p-4 bg-loss/10 border border-loss/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-loss shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-loss font-medium">元件載入失敗</p>
            <p className="text-xs text-muted-foreground mt-0.5">{this.state.error.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
