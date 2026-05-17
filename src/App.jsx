import { AppProvider }   from './context/AppContext'
import { EventProvider } from './context/EventContext'
import AppRouter         from './router/AppRouter'

export default function App() {
  return (
    <AppProvider>
      <EventProvider>
        <AppRouter />
      </EventProvider>
    </AppProvider>
  )
}
