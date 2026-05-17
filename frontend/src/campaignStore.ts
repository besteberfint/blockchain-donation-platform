export interface Campaign {
  id: string
  title: string
  description: string
  goalEth: string
  emoji: string
}

const DEFAULT: Campaign = {
  id: 'default',
  title: 'Eğitime Destek Kampanyası',
  description:
    "Türkiye'nin dezavantajlı bölgelerindeki okullara kırtasiye ve eğitim materyali sağlıyoruz. Her bağış bir çocuğun geleceğine dokunuyor.",
  goalEth: '3',
  emoji: '🎓',
}

export function getDefaultCampaigns(): Campaign[] {
  return [DEFAULT]
}
