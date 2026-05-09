import { useNavigate } from 'react-router-dom'

interface Props {
  onExplore: () => void
}

export function HeroSection({ onExplore }: Props) {
  const navigate = useNavigate()

  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-badge">⛓️ Blockchain Powered</div>
        <h1 className="hero-title">
          Şeffaf Bağışlar,<br />Güvenilir Gelecek
        </h1>
        <p className="hero-subtitle">
          Her bağışı blokzincirde takip edin. Paranızın nereye gittiğini her zaman görün.
        </p>
        <div className="hero-actions">
          <button className="btn btn-hero-primary" onClick={onExplore}>
            🎯 Kampanyaları Keşfet
          </button>
          <button className="btn btn-hero-outline" onClick={() => navigate('/dashboard')}>
            Dashboard →
          </button>
        </div>
      </div>
    </section>
  )
}
