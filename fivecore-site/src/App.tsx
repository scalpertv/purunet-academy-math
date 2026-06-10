// 5차원 자기주도학습 사이트 루트 컴포넌트 — 라우팅 정의
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AcademyDataProvider } from './context/AcademyDataContext'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { GuidePage } from './pages/GuidePage'
import { PlannerPage } from './pages/PlannerPage'
import { ReadingPage } from './pages/ReadingPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { MindmapPage } from './pages/MindmapPage'
import { DashboardPage } from './pages/DashboardPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { CurriculumPage } from './pages/CurriculumPage'
import { MeditationPage } from './pages/MeditationPage'
import { SchedulePage } from './pages/SchedulePage'
import { ReviewPage } from './pages/ReviewPage'

function App() {
  return (
    <AuthProvider>
    <AcademyDataProvider>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/guide/:grade" element={<GuidePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/mindmap" element={<MindmapPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/curriculum/:subject" element={<CurriculumPage />} />
          <Route path="/meditation" element={<MeditationPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/review" element={<ReviewPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </AcademyDataProvider>
    </AuthProvider>
  )
}

export default App
