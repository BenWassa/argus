import { AppProviders } from './AppProviders'
import { AuthGate } from './gate/AuthGate'

export function App() {
  return (
    <AppProviders>
      <AuthGate />
    </AppProviders>
  )
}
