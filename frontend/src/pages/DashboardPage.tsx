import { useAccount, useReadContract } from 'wagmi'
import { Stats } from '../components/Stats'
import { DonateForm } from '../components/DonateForm'
import { CreateRequestForm } from '../components/CreateRequestForm'
import { CampaignProposalList } from '../components/CampaignProposalList'
import { RequestList } from '../components/RequestList'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

export function DashboardPage() {
  const { address, isConnected } = useAccount()

  const { data: manager } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'manager',
  })

  const isManager = isConnected && !!manager && address?.toLowerCase() === manager.toLowerCase()

  return (
    <main className="container main">
      {isManager && (
        <div className="admin-banner">
          👑 Yönetici paneli — kampanya tekliflerini ve harcama taleplerini yönetebilirsiniz
        </div>
      )}
      <Stats />
      <div className="forms-row">
        <DonateForm />
        <CreateRequestForm />
      </div>
      <CampaignProposalList />
      <RequestList />
    </main>
  )
}
