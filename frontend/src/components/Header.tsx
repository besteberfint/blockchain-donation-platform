import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'

export function Header() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const wrongNetwork = isConnected && !!chain && chain.id !== hardhat.id && chain.id !== sepolia.id
  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum)
  const connector = connectors[0]

  function handleConnect() {
    if (!hasInjected) return
    connect({ connector })
  }

  function handleCopy() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div className="header-left">
            <NavLink to="/" className="header-brand">
              <span className="header-logo">⛓️</span>
              <span className="header-brand-name">Bağış Takip</span>
            </NavLink>
            <nav className="header-nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Kampanyalar
              </NavLink>
              {isConnected && (
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  Dashboard
                </NavLink>
              )}
            </nav>
          </div>

          <div className="header-right">
            {chain && (
              <span className="network-badge">
                🟢 {chain.name}
              </span>
            )}

            {isConnected ? (
              <>
                <button className="address-pill" onClick={handleCopy} title="Kopyala">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                  <span className="copy-icon">{copied ? '✓' : '📋'}</span>
                </button>
                <button className="btn btn-outline-white btn-sm" onClick={() => disconnect()}>
                  Çıkış
                </button>
              </>
            ) : !hasInjected ? (
              <a
                className="btn btn-white"
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
              >
                🦊 MetaMask Yükle
              </a>
            ) : (
              <button className="btn btn-white" disabled={isPending} onClick={handleConnect}>
                {isPending
                  ? <><span className="spinner" /> Bağlanıyor…</>
                  : '🦊 Cüzdan Bağla'}
              </button>
            )}
          </div>
        </div>

        {wrongNetwork && (
          <div className="chain-warning">
            ⚠️ Yanlış ağ — MetaMask'ta <strong>Hardhat Localhost</strong> veya <strong>Sepolia</strong> ağını seçin.
          </div>
        )}
        {connectError && !connectError.message.includes('already connected') && (
          <div className="chain-warning">
            ⚠️ Bağlantı hatası: {connectError.message}
          </div>
        )}
      </div>
    </header>
  )
}
