import { useRef, useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { HeroSection } from '../components/HeroSection'
import { CampaignCard } from '../components/CampaignCard'
import { DonateForm } from '../components/DonateForm'
import { CreateCampaignForm } from '../components/CreateCampaignForm'
import { getDefaultCampaigns } from '../campaignStore'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'
import type { Campaign } from '../campaignStore'

export function CampaignPage() {
  const donateRef = useRef<HTMLDivElement>(null)

  const { data: countData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'getCampaignProposalsCount',
  })

  const count = Number(countData ?? 0)

  const contracts = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'getCampaignProposal' as const,
      args: [BigInt(i)] as const,
    })),
    [count],
  )

  const { data: proposalsData } = useReadContracts({
    contracts,
    query: { enabled: count > 0 },
  })

  const approvedCampaigns: Campaign[] = (proposalsData ?? [])
    .map((p, i) => {
      if (p.status !== 'success' || !p.result) return null
      const r = p.result as unknown as {
        title: string; description: string; emoji: string
        goalWei: bigint; approved: boolean; rejected: boolean
      }
      if (!r.approved) return null
      return {
        id: `onchain-${i}`,
        title: r.title,
        description: r.description,
        emoji: r.emoji,
        goalEth: formatEther(r.goalWei),
      }
    })
    .filter((c): c is Campaign => c !== null)

  const allCampaigns = [...getDefaultCampaigns(), ...approvedCampaigns]

  function scrollToDonate() {
    donateRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <HeroSection onExplore={scrollToDonate} />

      <div className="container section">
        <h2 className="section-heading">Aktif Kampanyalar</h2>
        <div className="campaign-grid">
          {allCampaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} onDonate={scrollToDonate} />
          ))}
        </div>
      </div>

      <div className="container section">
        <h2 className="section-heading">Kampanya Öner</h2>
        <div style={{ maxWidth: 480 }}>
          <CreateCampaignForm />
        </div>
      </div>

      <div className="container section" ref={donateRef}>
        <h2 className="section-heading">Bağış Yap</h2>
        <div className="donate-section">
          <DonateForm />
        </div>
      </div>
    </main>
  )
}
