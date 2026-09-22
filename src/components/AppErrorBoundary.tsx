import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import AppCtaButton from './ui/AppCtaButton'

type Props = { children: ReactNode }

type State = {
  hasError: boolean
  message: string | null
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('AppErrorBoundary', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] px-6">
          <div className="flex items-end gap-2">
            <img src="/logo-mark.svg" alt="" className="pp-brand-mark h-7 w-7 translate-y-[2px]" width={28} height={28} />
            <span className="pp-wordmark text-xl">Private<span>Prep</span></span>
          </div>
          <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertTriangle className="h-10 w-10 text-red-600" aria-hidden />
            <h1 className="text-lg font-semibold text-slate-800">Etwas ist schiefgelaufen</h1>
            <p className="text-sm text-slate-600">
              Die Oberfläche ist abgestürzt. Bitte Seite neu laden. Wenn das wiederholt passiert, prüfe die
              Konsole (Entwicklermodus) oder melde den Fehler.
            </p>
            {this.state.message ? (
              <p className="w-full break-words rounded bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                {this.state.message}
              </p>
            ) : null}
            <AppCtaButton onClick={() => window.location.reload()}>
              Neu laden
            </AppCtaButton>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
