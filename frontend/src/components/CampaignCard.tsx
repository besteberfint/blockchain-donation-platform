import { useReadContract } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'
import type { Campaign } from '../campaignStore'

interface Props {
  campaign: Campaign
  onDonate: () => void
}

export function CampaignCard({ campaign, onDonate }: Props) {
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'getBalance',
  })

  const { data: totalDonors } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'totalDonors',
  })

  const { data: requestCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'getRequestsCount',
  })

  const goal = parseEther(campaign.goalEth)
  const bal = balance ?? 0n
  const progress = bal > 0n ? Math.min(100, Number((bal * 100n) / goal)) : 0
  const raised = parseFloat(formatEther(bal)).toFixed(3)

  return (
    <div className="campaign-card">
      <div className="campaign-card-image">
        <span className="campaign-card-emoji">{campaign.emoji}</span>
        <span className="campaign-badge">🔥 Aktif</span>
        <span className="campaign-badge-right">
          ❤️ {totalDonors?.toString() ?? '0'} bağışçı
        </span>
      </div>

      <div className="campaign-card-body">
        <h3 className="campaign-title">{campaign.title}</h3>
        <p className="campaign-desc">{campaign.description}</p>

        <div className="campaign-progress-label">
          <span>💰 {raised} / {campaign.goalEth} ETH</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div className="campaign-track">
          <div className="campaign-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="campaign-meta">
          <span>👥 {totalDonors?.toString() ?? '0'} bağışçı</span>
          <span>📋 {requestCount?.toString() ?? '0'} harcama talebi</span>
          <span className="meta-live">🟢 Canlı</span>
        </div>

        <button className="btn btn-donate" onClick={onDonate}>
          ❤️ Bağış Yap
        </button>
      </div>
    </div>
  )
}
