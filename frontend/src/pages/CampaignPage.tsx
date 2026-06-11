import { useState, useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { HeroSection } from '../components/HeroSection'
import { CampaignCard } from '../components/CampaignCard'
import { CampaignDonateForm } from '../components/CampaignDonateForm'
import { CreateCampaignForm } from '../components/CreateCampaignForm'
import { getDefaultCampaigns } from '../campaignStore'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'
import type { Campaign } from '../campaignStore'

interface SelectedCampaign {
  campaign: Campaign
  index: number | null
}

export function CampaignPage() {
  const [selected, setSelected] = useState<SelectedCampaign | null>(null)

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

  const approvedCampaigns: (Campaign & { onchainIndex: number })[] = (proposalsData ?? [])
    .map((p, i) => {
      if (p.status !== 'success' || !p.result) return null
      const [, title, description, emoji, goalWei, approved] =
        p.result as unknown as [Address, string, string, string, bigint, boolean, boolean]
      if (!approved) return null
      return {
        id: `onchain-${i}`,
        title,
        description,
        emoji,
        goalEth: formatEther(goalWei),
        onchainIndex: i,
      }
    })
    .filter((c): c is Campaign & { onchainIndex: number } => c !== null)

  const defaultCampaigns = getDefaultCampaigns().map(c => ({ ...c, onchainIndex: null as number | null }))
  const allCampaigns = [...defaultCampaigns, ...approvedCampaigns]

  return (
    <main>
      <HeroSection onExplore={() => document.querySelector('.campaign-grid')?.scrollIntoView({ behavior: 'smooth' })} />

      <div className="container section">
        <h2 className="section-heading">Aktif Kampanyalar</h2>
        <div className="campaign-grid">
          {allCampaigns.map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              campaignIndex={c.onchainIndex}
              onDonate={() => setSelected({ campaign: c, index: c.onchainIndex })}
            />
          ))}
        </div>
      </div>

      <div className="container section">
        <h2 className="section-heading">Kampanya Öner</h2>
        <div style={{ maxWidth: 480 }}>
          <CreateCampaignForm />
        </div>
      </div>

      {selected && (
        <CampaignDonateForm
          campaignIndex={selected.index}
          campaignTitle={selected.campaign.title}
          campaignEmoji={selected.campaign.emoji}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  )
}
