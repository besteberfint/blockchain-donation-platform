import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import type { Address } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const

export function CreateRequestForm() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  const { data: manager } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'manager',
  })

  const isManager = isConnected && manager && address?.toLowerCase() === manager.toLowerCase()

  const [desc, setDesc] = useState('')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [localError, setLocalError] = useState('')

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries()
      setDesc('')
      setVendor('')
      setAmount('')
      reset()
    }
  }, [isSuccess, queryClient, reset])

  function handleCreate() {
    setLocalError('')
    if (!desc.trim()) { setLocalError('Açıklama boş olamaz.'); return }
    if (!isAddress(vendor)) { setLocalError('Geçerli bir Ethereum adresi girin.'); return }
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) { setLocalError('Geçerli bir miktar girin.'); return }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CHARITY_ABI,
      functionName: 'createRequest',
      args: [desc, vendor as Address, parseEther(amount)],
    })
  }

  if (!isManager) return null

  const isLoading = isPending || isConfirming

  return (
    <div className="card">
      <p className="card-title">📋 Harcama Talebi Oluştur</p>

      <div className="form-group">
        <label className="form-label">Açıklama</label>
        <input
          className="form-input"
          type="text"
          placeholder="ör. Okul inşaatı malzeme alımı"
          value={desc}
          onChange={e => { setDesc(e.target.value); setLocalError('') }}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tedarikçi Adresi</label>
        <input
          className="form-input"
          type="text"
          placeholder="0x…"
          value={vendor}
          onChange={e => { setVendor(e.target.value); setLocalError('') }}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Miktar (ETH)</label>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="ör. 2.0"
          value={amount}
          onChange={e => { setAmount(e.target.value); setLocalError('') }}
          disabled={isLoading}
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleCreate}
        disabled={isLoading}
      >
        {isLoading
          ? <><span className="spinner" /> {isConfirming ? 'Onaylanıyor…' : 'Gönderiliyor…'}</>
          : 'Talep Oluştur'}
      </button>

      {localError && <div className="alert alert-error">⚠️ {localError}</div>}
      {writeError && <div className="alert alert-error">⚠️ {(writeError as Error).message?.slice(0, 120)}</div>}
      {isSuccess && <div className="alert alert-success">✅ Talep başarıyla oluşturuldu!</div>}
    </div>
  )
}
