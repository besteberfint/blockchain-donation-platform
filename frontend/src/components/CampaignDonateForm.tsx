import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const QUICK_AMOUNTS = ['0.1', '0.5', '1']

interface Props {
  campaignIndex: number | null
  campaignTitle: string
  campaignEmoji: string
  onClose: () => void
}

export function CampaignDonateForm({ campaignIndex, campaignTitle, campaignEmoji, onClose }: Props) {
  const { isConnected } = useAccount()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [localError, setLocalError] = useState('')

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries()
      setAmount('')
      reset()
    }
  }, [isSuccess, queryClient, reset])

  function handleDonate() {
    setLocalError('')
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setLocalError('Geçerli bir miktar girin.')
      return
    }
    if (campaignIndex !== null) {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHARITY_ABI,
        functionName: 'donateToCampaign',
        args: [BigInt(campaignIndex)],
        value: parseEther(amount),
      })
    } else {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHARITY_ABI,
        functionName: 'donate',
        value: parseEther(amount),
      })
    }
  }

  const isLoading = isPending || isConfirming

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Kapat">✕</button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '2.5rem' }}>{campaignEmoji}</span>
          <p className="card-title" style={{ marginTop: '0.5rem', marginBottom: 0, justifyContent: 'center' }}>
            {campaignTitle}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            {campaignIndex !== null
              ? 'Bağışınız doğrudan bu kampanyaya kaydedilecek.'
              : 'Bağışınız genel fona aktarılacak.'}
          </p>
        </div>

        {!isConnected ? (
          <div className="connect-prompt">
            <p style={{ fontSize: '1.5rem' }}>🎁</p>
            <p>Bağış yapmak için cüzdanınızı bağlayın.</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Hızlı Seçim</label>
              <div className="quick-amounts">
                {QUICK_AMOUNTS.map(q => (
                  <button
                    key={q}
                    className={`btn-quick${amount === q ? ' active' : ''}`}
                    onClick={() => { setAmount(q); setLocalError('') }}
                    disabled={isLoading}
                  >
                    {q} ETH
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Miktar (ETH)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="ör. 0.5"
                value={amount}
                onChange={e => { setAmount(e.target.value); setLocalError('') }}
                disabled={isLoading}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleDonate}
              disabled={isLoading}
            >
              {isLoading
                ? <><span className="spinner" /> {isConfirming ? 'Onaylanıyor…' : 'Gönderiliyor…'}</>
                : '❤️ Bağış Yap'}
            </button>

            {localError && <div className="alert alert-error">⚠️ {localError}</div>}
            {writeError && <div className="alert alert-error">⚠️ {(writeError as Error).message?.slice(0, 120)}</div>}
            {isSuccess && <div className="alert alert-success">✅ Bağışınız başarıyla tamamlandı!</div>}
          </>
        )}
      </div>
    </div>
  )
}
