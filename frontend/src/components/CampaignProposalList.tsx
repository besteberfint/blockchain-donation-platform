import { useEffect, useMemo } from 'react'
import {
  useAccount, useReadContract, useReadContracts,
  useWriteContract, useWaitForTransactionReceipt,
} from 'wagmi'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

type Proposal = {
  proposer: Address
  title: string
  description: string
  emoji: string
  goalWei: bigint
  approved: boolean
  rejected: boolean
  index: number
}

export function CampaignProposalList() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  const { data: manager } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'manager',
  })

  const isManager = isConnected && !!manager && address?.toLowerCase() === manager.toLowerCase()

  const { data: countData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'getCampaignProposalsCount',
    query: { enabled: isManager },
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
    query: { enabled: isManager && count > 0 },
  })

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) queryClient.invalidateQueries()
  }, [isSuccess, queryClient])

  if (!isManager) return null

  const proposals: Proposal[] = (proposalsData ?? [])
    .map((p, i) => {
      if (p.status !== 'success' || !p.result) return null
      const r = p.result as unknown as {
        proposer: Address; title: string; description: string
        emoji: string; goalWei: bigint; approved: boolean; rejected: boolean
      }
      return { ...r, index: i }
    })
    .filter((p): p is Proposal => p !== null)

  const pending  = proposals.filter(p => !p.approved && !p.rejected)
  const approved = proposals.filter(p => p.approved)
  const rejected = proposals.filter(p => p.rejected)

  const isLoading = isPending || isConfirming

  function doApprove(index: number) {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'approveCampaign',
      args: [BigInt(index)],
    })
  }

  function doReject(index: number) {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'rejectCampaign',
      args: [BigInt(index)],
    })
  }

  return (
    <div className="card">
      <p className="card-title">📋 Kampanya Teklifleri</p>

      {count === 0 && (
        <div className="empty-state" style={{ padding: '1.5rem 0' }}>
          <div className="empty-icon">📭</div>
          <p>Henüz kampanya teklifi yok.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="proposal-section">
          <div className="proposal-section-title">⏳ Bekleyen ({pending.length})</div>
          {pending.map(p => (
            <div key={p.index} className="proposal-card proposal-pending">
              <div className="proposal-header">
                <span className="proposal-emoji">{p.emoji}</span>
                <div className="proposal-info">
                  <div className="proposal-title">{p.title}</div>
                  <div className="proposal-meta">
                    🎯 {formatEther(p.goalWei)} ETH &nbsp;·&nbsp;
                    👤 {p.proposer.slice(0, 6)}…{p.proposer.slice(-4)}
                  </div>
                </div>
              </div>
              {p.description && <p className="proposal-desc">{p.description}</p>}
              <div className="proposal-actions">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => doApprove(p.index)}
                  disabled={isLoading}
                >
                  {isLoading ? <span className="spinner" /> : '✅ Onayla'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => doReject(p.index)}
                  disabled={isLoading}
                >
                  {isLoading ? <span className="spinner" /> : '❌ Reddet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="proposal-section">
          <div className="proposal-section-title">✅ Onaylanan ({approved.length})</div>
          {approved.map(p => (
            <div key={p.index} className="proposal-card proposal-approved">
              <span className="proposal-emoji">{p.emoji}</span>
              <div className="proposal-info">
                <div className="proposal-title">{p.title}</div>
                <div className="proposal-meta">🎯 {formatEther(p.goalWei)} ETH</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="proposal-section">
          <div className="proposal-section-title">❌ Reddedilen ({rejected.length})</div>
          {rejected.map(p => (
            <div key={p.index} className="proposal-card proposal-rejected">
              <span className="proposal-emoji">{p.emoji}</span>
              <div className="proposal-info">
                <div className="proposal-title">{p.title}</div>
                <div className="proposal-meta">🎯 {formatEther(p.goalWei)} ETH</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {writeError && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
          ⚠️ {(writeError as Error).message?.slice(0, 120)}
        </div>
      )}
      {isSuccess && (
        <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>
          ✅ İşlem tamamlandı.
        </div>
      )}
    </div>
  )
}
