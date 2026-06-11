import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const QUICK_AMOUNTS = ['0.1', '0.5', '1']

export function DonateForm() {
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
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHARITY_ABI,
        functionName: 'donate',
        value: parseEther(amount),
      })
    } catch {
      // writeError handles this
    }
  }

  const isLoading = isPending || isConfirming

  if (!isConnected) {
    return (
      <div className="card connect-prompt">
        <p style={{ fontSize: '1.5rem' }}>🎁</p>
        <p>Bağış yapmak için cüzdanınızı bağlayın.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="card-title">🎁 Bağış Yap</p>

      <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
        <strong>Bağışınız nereye gider?</strong>
        <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem' }}>
          <li>Bağışladığınız ETH, akıllı sözleşmedeki ortak havuza aktarılır.</li>
          <li>Yönetici, fonların nasıl kullanılacağına dair <em>harcama talepleri</em> oluşturur.</li>
          <li>Her talep için bağışçılar oy kullanır; çoğunluk oyu sağlanmadan hiçbir ödeme yapılamaz.</li>
          <li>Tüm işlemler blok zincirinde şeffaf biçimde kaydedilir.</li>
        </ul>
      </div>

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
          : 'Bağış Yap'}
      </button>

      {localError && <div className="alert alert-error">⚠️ {localError}</div>}
      {writeError && <div className="alert alert-error">⚠️ {(writeError as Error).message?.slice(0, 120)}</div>}
      {isSuccess && <div className="alert alert-success">✅ Bağışınız başarıyla tamamlandı!</div>}
    </div>
  )
}
