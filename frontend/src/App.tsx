import { HashRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { AppStateProvider } from './state/AppState'
import { Home } from './pages/Home'
import { Save } from './pages/Save'
import { Find } from './pages/Find'
import { Result } from './pages/Result'
import { Explain } from './pages/Explain'
import { Navigate } from './pages/Navigate'
import { Saved } from './pages/Saved'
import { Analytics } from './pages/Analytics'
import { HowItWorks } from './pages/HowItWorks'

function App() {
  return (
    <LanguageProvider>
      <AppStateProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/save" element={<Save />} />
            <Route path="/find" element={<Find />} />
            <Route path="/result" element={<Result />} />
            <Route path="/explain" element={<Explain />} />
            <Route path="/navigate" element={<Navigate />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Routes>
        </HashRouter>
      </AppStateProvider>
    </LanguageProvider>
  )
}

export default App
