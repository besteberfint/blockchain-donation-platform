# Blockchain Tabanlı Bağış Takip Sistemi

Ethereum blokzinciri üzerinde çalışan şeffaf bağış platformu. Her bağış ve harcama işlemi zincirde değiştirilemez şekilde kayıtlıdır; bağışçılar harcamaları oylamaya katılarak denetleyebilir.

## Özellikler

- **Bağış yap** — MetaMask ile ETH gönderin, bakiye anlık güncellenir
- **Harcama talebi oluştur** — Yönetici, tedarikçi adresine ödeme talebi açar
- **Oylama** — Sadece bağışçılar oy verebilir; çifte oy koruması mevcuttur
- **Finalize** — Bağışçıların yarısından fazlası onaylarsa yönetici ödemeyi gerçekleştirir
- **Reentrancy koruması** — `nonReentrant` modifier + CEI pattern
- **Otomatik adres senkronizasyonu** — `npm run deploy` sonrası kontrat adresi frontend'e otomatik yazılır

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Akıllı kontrat | Solidity 0.8.20 |
| Geliştirme ortamı | Hardhat 3 (viem tabanlı) + Ignition |
| Testler | Node.js test runner + Chai (34 test) |
| Frontend | React 18 + Vite 5 + TypeScript |
| Blockchain bağlantısı | Wagmi v2 + Viem v2 |
| Cüzdan | MetaMask (injected connector) |

## Kurulum

```bash
# Bağımlılıkları yükle (proje kökü)
npm install

# Frontend bağımlılıklarını yükle
cd frontend && npm install && cd ..
```

## Çalıştırma

Üç ayrı terminal gereklidir:

```bash
# Terminal 1 — Yerel Hardhat node'u başlat
npm run node

# Terminal 2 — Kontratı deploy et (adres otomatik synclenir)
npm run deploy

# Terminal 3 — Frontend dev server
cd frontend && npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

> **MetaMask ayarı:** Ağ olarak `Hardhat Localhost` (Chain ID: 31337, RPC: `http://127.0.0.1:8545`) seçilmeli. Hardhat node başlatıldığında konsolda görünen test hesap private key'lerinden birini MetaMask'a import edebilirsiniz.

## Kullanılabilir Komutlar

```bash
npm run compile    # Solidity kontratı derle
npm run test       # 34 testi çalıştır
npm run node       # Yerel Hardhat node başlat (chain ID 31337)
npm run deploy     # Kontratı deploy et + adresi frontend'e yaz
npm run scenario   # Uçtan uca demo senaryosu (bağış → talep → oy → ödeme)
```

## Proje Yapısı

```
blockchain-donation-platform/
├── contracts/
│   └── Charity.sol              # Akıllı kontrat
├── test/
│   └── Charity.ts               # 34 entegrasyon testi
├── ignition/modules/
│   └── Charity.ts               # Hardhat Ignition deployment modülü
├── scripts/
│   ├── deploy.ts                # Deployment scripti
│   ├── interact.ts              # Uçtan uca senaryo scripti
│   └── sync-address.mjs         # Kontrat adresini frontend'e yazan postdeploy hooku
├── frontend-exports/
│   ├── Charity.abi.json         # Kontrat ABI'ı (ayrı kullanım için)
│   └── config.ts                # Kontrat adresi + ABI export
└── frontend/
    └── src/
        ├── contract.ts          # CONTRACT_ADDRESS + ABI (sync-address tarafından güncellenir)
        ├── wagmi.ts             # Wagmi config (localhost chain)
        ├── App.tsx              # Ana uygulama, her blokta otomatik yenileme
        └── components/
            ├── Header.tsx       # Cüzdan bağlantısı, ağ uyarısı
            ├── Stats.tsx        # Bakiye, bağışçı sayısı, rolünüz
            ├── DonateForm.tsx   # Bağış formu
            ├── CreateRequestForm.tsx  # Harcama talebi (yalnızca yönetici)
            ├── RequestList.tsx  # Tüm talepleri listeler
            └── RequestCard.tsx  # Oy verme, finalize, oy çubuğu
```

## Kontrat Akışı

```
donate()
  └─> createRequest()      [yalnızca yönetici]
        └─> voteRequest()  [yalnızca bağışçılar]
              └─> finalizeRequest()  [yalnızca yönetici, çoğunluk şartı]
```

## Testler

```bash
npm run test
```

34 test; deployment, bağış, harcama talebi, oylama, finalize ve güvenlik senaryolarını kapsar.

## Demo Senaryosu

Hardhat node çalışırken ve kontrat deploy edildikten sonra:

```bash
npm run scenario
```

3 bağışçı → harcama talebi → 2/3 onay → otomatik ödeme akışını konsolda adım adım gösterir.
