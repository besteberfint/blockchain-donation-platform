# Blockchain Tabanlı Bağış Takip Sistemi

Ethereum blokzinciri üzerinde çalışan şeffaf bağış platformu. Her bağış ve harcama işlemi zincirde değiştirilemez şekilde kayıtlıdır; bağışçılar harcamaları oylamaya katılarak denetleyebilir.

**Canlı ağ:** Sepolia Testnet — `0x79878186b6FA4719e93a1604563c41b45ddFCA96`

## Özellikler

- **Landing page** — kampanya kartı, hero section, canlı istatistikler
- **Bağış yap** — MetaMask ile ETH gönder, hızlı miktar butonları (0.1 / 0.5 / 1 ETH)
- **Harcama talebi** — Yönetici, tedarikçi adresine ödeme talebi açar (sadece admin)
- **Oylama** — Sadece bağışçılar oy verebilir; çifte oy koruması mevcuttur
- **Finalize** — Bağışçıların yarısından fazlası onaylarsa yönetici ödemeyi gerçekleştirir
- **Admin / Kullanıcı ayrımı** — Yönetici paneli ve genel kampanya sayfası ayrıdır
- **Reentrancy koruması** — `nonReentrant` modifier + CEI pattern

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Akıllı kontrat | Solidity 0.8.20 |
| Geliştirme ortamı | Hardhat 3 (viem tabanlı) + Ignition |
| Testler | Node.js test runner + Chai (34 test) |
| Frontend | React 18 + Vite 5 + TypeScript |
| Routing | React Router v6 |
| Blockchain bağlantısı | Wagmi v2 + Viem v2 |
| Cüzdan | MetaMask (injected connector) |
| Ağlar | Sepolia Testnet / Hardhat Localhost |

## Kullanıcı Olarak Çalıştırma (Sepolia)

Kontrat Sepolia'da canlı olduğu için sadece frontend'i başlatman yeterli:

```bash
cd frontend && npm install && npm run dev
```

Tarayıcıda `http://localhost:5173` aç, MetaMask'ta **Sepolia** ağını seç, cüzdanı bağla.

> Sepolia ETH için: `faucet.sepolia.dev` adresinden Google hesabıyla ücretsiz test ETH alabilirsin.

## Geliştirici Kurulumu (Localhost)

```bash
# Bağımlılıkları yükle
npm install
cd frontend && npm install && cd ..
```

Üç ayrı terminal:

```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy

# Terminal 3
cd frontend && npm run dev
```

## Sepolia'ya Deploy

`.env` dosyası oluştur (`.env.example`'ı kopyala):
```
SEPOLIA_PRIVATE_KEY=0xsenin_private_keyin
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

```bash
npm run deploy:sepolia
```

## Kullanılabilir Komutlar

```bash
npm run compile          # Solidity kontratı derle
npm run test             # 34 testi çalıştır
npm run node             # Yerel Hardhat node başlat
npm run deploy           # Localhost'a deploy et
npm run deploy:sepolia   # Sepolia'ya deploy et
npm run scenario         # Uçtan uca demo senaryosu
```

## Proje Yapısı

```
blockchain-donation-platform/
├── contracts/
│   └── Charity.sol
├── test/
│   └── Charity.ts               # 34 entegrasyon testi
├── ignition/modules/
│   └── Charity.ts               # Deployment modülü
├── scripts/
│   ├── interact.ts              # Uçtan uca senaryo
│   └── sync-address.mjs         # Kontrat adresini frontend'e yazan hook
└── frontend/
    └── src/
        ├── pages/
        │   ├── CampaignPage.tsx     # Landing page (herkese açık)
        │   └── DashboardPage.tsx    # Admin / bağışçı paneli
        ├── components/
        │   ├── Header.tsx           # Navbar, cüzdan bağlantısı
        │   ├── HeroSection.tsx      # Hero bölümü
        │   ├── CampaignCard.tsx     # Kampanya kartı (canlı veriler)
        │   ├── Stats.tsx            # İstatistik kartları
        │   ├── DonateForm.tsx       # Bağış formu
        │   ├── CreateRequestForm.tsx
        │   ├── RequestList.tsx
        │   └── RequestCard.tsx
        ├── contract.ts              # CONTRACT_ADDRESS + ABI
        └── wagmi.ts                 # Wagmi config
```

## Kontrat Akışı

```
donate()
  └─> createRequest()      [yalnızca yönetici]
        └─> voteRequest()  [yalnızca bağışçılar]
              └─> finalizeRequest()  [yalnızca yönetici, çoğunluk şartı]
```

## Roller

| Rol | Kim | Yetkiler |
|-----|-----|----------|
| Yönetici | Kontratı deploy eden hesap | Harcama talebi oluşturma, finalize |
| Bağışçı | Bağış yapmış herhangi bir hesap | Bağış yapma, talepleri oylama |
| Ziyaretçi | Bağışı olmayan hesap | Sadece görüntüleme |
