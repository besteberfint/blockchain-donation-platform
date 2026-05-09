import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const GOAL = 10n * 10n ** 18n // 10 ETH

interface Props {
  onDonate: () => void
}

export function CampaignCard({ onDonate }: Props) {
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

  const bal = balance ?? 0n
  const progress = bal > 0n ? Math.min(100, Number((bal * 100n) / GOAL)) : 0
  const raised = parseFloat(formatEther(bal)).toFixed(3)
  const goal = parseFloat(formatEther(GOAL)).toFixed(0)

  return (
    <div className="campaign-card">
      <div className="campaign-card-image">
        <span className="campaign-card-emoji">🎓</span>
        <span className="campaign-badge">🔥 Aktif</span>
        <span className="campaign-badge-right">
          ❤️ {totalDonors?.toString() ?? '0'} bağışçı
        </span>
      </div>

      <div className="campaign-card-body">
        <h3 className="campaign-title">Eğitime Destek Kampanyası</h3>
        <p className="campaign-desc">
          Türkiye'nin dezavantajlı bölgelerindeki okullara kırtasiye ve eğitim materyali
          sağlıyoruz. Her bağış bir çocuğun geleceğine dokunuyor.
        </p>

        <div className="campaign-progress-label">
          <span>💰 {raised} / {goal} ETH</span>
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
