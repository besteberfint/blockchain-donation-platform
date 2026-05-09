import { useRef } from 'react'
import { HeroSection } from '../components/HeroSection'
import { CampaignCard } from '../components/CampaignCard'
import { DonateForm } from '../components/DonateForm'

export function CampaignPage() {
  const donateRef = useRef<HTMLDivElement>(null)

  function scrollToDonate() {
    donateRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <HeroSection onExplore={scrollToDonate} />

      <div className="container section">
        <h2 className="section-heading">Aktif Kampanyalar</h2>
        <div className="campaign-grid">
          <CampaignCard onDonate={scrollToDonate} />
        </div>
      </div>

      <div className="container section" ref={donateRef}>
        <h2 className="section-heading">Bağış Yap</h2>
        <div className="donate-section">
          <DonateForm />
        </div>
      </div>
    </main>
  )
}
