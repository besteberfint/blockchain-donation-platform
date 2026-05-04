import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { hardhat } from 'wagmi/chains'

export function Header() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()

  const wrongNetwork = isConnected && chain?.id !== hardhat.id
  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum)
  const connector = connectors[0]

  function handleConnect() {
    if (!hasInjected) return
    connect({ connector })
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-logo">⛓️</span>
            <div>
              <h1>Bağış Takip Sistemi</h1>
              <p>Blockchain tabanlı şeffaf bağış platformu</p>
            </div>
          </div>

          <div className="header-right">
            {isConnected ? (
              <>
                <span className="address-pill">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </span>
                <button
                  className="btn btn-outline-white btn-sm"
                  onClick={() => disconnect()}
                >
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
              <button
                className="btn btn-white"
                disabled={isPending}
                onClick={handleConnect}
              >
                {isPending
                  ? <><span className="spinner" /> Bağlanıyor…</>
                  : '🦊 Cüzdan Bağla'}
              </button>
            )}
          </div>
        </div>

        {wrongNetwork && (
          <div className="chain-warning">
            ⚠️ Yanlış ağ — MetaMask'ta <strong>Hardhat Localhost (31337)</strong> ağını seçin.
          </div>
        )}

        {connectError && (
          <div className="chain-warning">
            ⚠️ Bağlantı hatası: {connectError.message}
          </div>
        )}
      </div>
    </header>
  )
}
