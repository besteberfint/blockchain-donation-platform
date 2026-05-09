import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useBlockNumber } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from './components/Header'
import { CampaignPage } from './pages/CampaignPage'
import { DashboardPage } from './pages/DashboardPage'

function useAutoRefresh() {
  const queryClient = useQueryClient()
  const { data: blockNumber } = useBlockNumber({ watch: true })
  useEffect(() => {
    queryClient.invalidateQueries()
  }, [blockNumber, queryClient])
}

export default function App() {
  useAutoRefresh()
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<CampaignPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
