import { useAccount, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const

export function Stats() {
  const { address, isConnected } = useAccount()

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

  const { data: manager } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'manager',
  })

  const { data: myDonation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'donations',
    args: [address ?? ZERO_ADDR],
    query: { enabled: isConnected },
  })

  const isManager = isConnected && manager && address?.toLowerCase() === manager.toLowerCase()
  const isDonor = isConnected && myDonation !== undefined && myDonation > 0n
  const role = isManager ? 'Yönetici 👑' : isDonor ? 'Bağışçı 🎁' : 'Ziyaretçi'

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-icon">🌍</span>
        <div>
          <p className="stat-label">Toplam Toplanan</p>
          <p className="stat-value">
            {balance !== undefined ? `${parseFloat(formatEther(balance)).toFixed(4)} ETH` : '—'}
          </p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon">👥</span>
        <div>
          <p className="stat-label">Küresel Bağışçı</p>
          <p className="stat-value">{totalDonors?.toString() ?? '—'}</p>
        </div>
      </div>

      {isConnected && (
        <>
          <div className="stat-card">
            <span className="stat-icon">❤️</span>
            <div>
              <p className="stat-label">Bağışlarım</p>
              <p className="stat-value">
                {myDonation !== undefined
                  ? `${parseFloat(formatEther(myDonation)).toFixed(4)} ETH`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">👤</span>
            <div>
              <p className="stat-label">Profilim</p>
              <p className="stat-value" style={{ fontSize: '1rem' }}>{role}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
