import { useEffect } from 'react'
import { useBlockNumber } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from './components/Header'
import { Stats } from './components/Stats'
import { DonateForm } from './components/DonateForm'
import { CreateRequestForm } from './components/CreateRequestForm'
import { RequestList } from './components/RequestList'

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
    <>
      <Header />
      <main className="container main">
        <Stats />

        <div className="forms-row">
          <DonateForm />
          <CreateRequestForm />
        </div>

        <RequestList />
      </main>
    </>
  )
}
