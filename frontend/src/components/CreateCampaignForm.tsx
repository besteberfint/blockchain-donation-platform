import { useState, useEffect, useMemo } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const EMOJIS = ['🎓', '🏥', '🌱', '🏠', '🤝', '💙', '🌍', '🎨', '🍀', '🐾']

export function CreateCampaignForm() {
  const { isConnected } = useAccount()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [goalEth, setGoalEth] = useState('')
  const [emoji, setEmoji] = useState('🎓')
  const [localError, setLocalError] = useState('')

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries()
      setTitle('')
      setDesc('')
      setGoalEth('')
      setEmoji('🎓')
      reset()
    }
  }, [isSuccess, queryClient, reset])

  function handlePropose() {
    setLocalError('')
    if (!title.trim()) { setLocalError('Başlık boş olamaz.'); return }
    const g = parseFloat(goalEth)
    if (!goalEth || isNaN(g) || g <= 0) { setLocalError('Geçerli bir hedef ETH miktarı girin.'); return }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'proposeCampaign',
      args: [title.trim(), desc.trim(), emoji, parseEther(goalEth)],
    })
  }

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <p>Kampanya önermek için MetaMask bağlantısı gerekiyor.</p>
      </div>
    )
  }

  const isLoading = isPending || isConfirming

  return (
    <div className="card">
      <p className="card-title">🚀 Kampanya Öner</p>

      <div className="form-group">
        <label className="form-label">Emoji</label>
        <div className="emoji-picker">
          {EMOJIS.map(e => (
            <button
              key={e}
              className={`emoji-btn${emoji === e ? ' active' : ''}`}
              onClick={() => setEmoji(e)}
              type="button"
              disabled={isLoading}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Kampanya Adı</label>
        <input
          className="form-input"
          type="text"
          placeholder="ör. Sağlık Kampanyası"
          value={title}
          onChange={e => { setTitle(e.target.value); setLocalError('') }}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Açıklama</label>
        <textarea
          className="form-input"
          rows={3}
          placeholder="Kampanya hakkında kısa bir açıklama..."
          value={desc}
          onChange={e => { setDesc(e.target.value) }}
          style={{ resize: 'vertical' }}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Hedef (ETH)</label>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.1"
          placeholder="ör. 5.0"
          value={goalEth}
          onChange={e => { setGoalEth(e.target.value); setLocalError('') }}
          disabled={isLoading}
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handlePropose}
        disabled={isLoading}
      >
        {isLoading
          ? <><span className="spinner" /> {isConfirming ? 'Onaylanıyor…' : 'Gönderiliyor…'}</>
          : '📤 Teklif Gönder'}
      </button>

      {localError && <div className="alert alert-error">⚠️ {localError}</div>}
      {writeError && <div className="alert alert-error">⚠️ {(writeError as Error).message?.slice(0, 120)}</div>}
      {isSuccess && <div className="alert alert-success">✅ Teklifiniz gönderildi! Admin onayı bekleniyor.</div>}
    </div>
  )
}
