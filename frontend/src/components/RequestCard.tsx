import { useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const

interface Props {
  requestId: number
  description: string
  vendor: Address
  amount: bigint
  votes: bigint
  completed: boolean
  totalDonors: bigint
  isManager: boolean
  isDonor: boolean
}

export function RequestCard({
  requestId, description, vendor, amount, votes, completed,
  totalDonors, isManager, isDonor,
}: Props) {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const { data: voted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'hasVoted',
    args: [BigInt(requestId), address ?? ZERO_ADDR],
    query: { enabled: !!address },
  })

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries()
      reset()
    }
  }, [isSuccess, queryClient, reset])

  const majority = totalDonors > 0n && votes > totalDonors / 2n
  const votePercent = totalDonors > 0n
    ? Math.min(100, Number((votes * 100n) / totalDonors))
    : 0

  const canVote = isDonor && !voted && !completed
  const canFinalize = isManager && !completed && majority

  const status = completed ? 'completed' : majority ? 'approved' : 'pending'
  const statusLabel = { completed: '✓ Tamamlandı', approved: '✓ Onaylandı', pending: '⏳ Bekliyor' }
  const badgeClass = { completed: 'badge-completed', approved: 'badge-approved', pending: 'badge-pending' }

  const isLoading = isPending || isConfirming

  function handleVote() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'voteRequest',
      args: [BigInt(requestId)],
    })
  }

  function handleFinalize() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'finalizeRequest',
      args: [BigInt(requestId)],
    })
  }

  return (
    <div className={`req-card status-${status}`}>
      <div>
        <p className="req-id">Talep #{requestId + 1}</p>
        <p className="req-desc">{description}</p>
        <div className="req-meta">
          <span>💎 {parseFloat(formatEther(amount)).toFixed(4)} ETH</span>
          <span>
            🏪 <span className="req-vendor">{vendor.slice(0, 8)}…{vendor.slice(-6)}</span>
          </span>
        </div>

        <div className="vote-section">
          <div className="vote-label">
            <span>🗳️ {votes.toString()} / {totalDonors.toString()} oy</span>
            {majority && !completed && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Çoğunluk sağlandı</span>}
          </div>
          <div className="vote-track">
            <div
              className={`vote-fill${majority ? ' majority' : ''}`}
              style={{ width: `${votePercent}%` }}
            />
          </div>
        </div>

        {writeError && (
          <div className="alert alert-error" style={{ marginTop: '0.5rem' }}>
            ⚠️ {(writeError as Error).message?.slice(0, 100)}
          </div>
        )}
        {isSuccess && (
          <div className="alert alert-success" style={{ marginTop: '0.5rem' }}>
            ✅ İşlem tamamlandı!
          </div>
        )}
      </div>

      <div className="req-actions">
        <span className={`badge ${badgeClass[status]}`}>{statusLabel[status]}</span>

        {canVote && (
          <button className="btn btn-primary btn-sm" onClick={handleVote} disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : '🗳️ Oy Ver'}
          </button>
        )}

        {canFinalize && (
          <button className="btn btn-success btn-sm" onClick={handleFinalize} disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : '💸 Ödemeyi Yap'}
          </button>
        )}

        {isDonor && voted && !completed && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>✓ Oyunuzu kullandınız</span>
        )}
      </div>
    </div>
  )
}
