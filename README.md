# Blockchain Tabanlı Bağış Takip Sistemi

Ethereum blokzinciri üzerinde çalışan şeffaf ve merkeziyetsiz bir bağış platformu. Her bağış ve harcama işlemi zincirde değiştirilemez biçimde kayıtlıdır; bağışçılar, fonların nereye harcandığını blokzinciri üzerinden bizzat denetleyip oylayabilir.

**Canlı ağ:** Sepolia Testnet  
**Kontrat adresi:** `0x5310F27a846a5b88af0A90D31f32AAF72af7A608`  
**Etherscan:** [Sepolia üzerinde görüntüle](https://sepolia.etherscan.io/address/0x5310F27a846a5b88af0A90D31f32AAF72af7A608)

---

## İçindekiler

1. [Proje Hakkında](#proje-hakkında)
2. [Özellikler](#özellikler)
3. [Teknoloji Yığını](#teknoloji-yığını)
4. [Proje Yapısı](#proje-yapısı)
5. [Akıllı Kontrat Detayları](#akıllı-kontrat-detayları)
6. [Frontend Mimarisi](#frontend-mimarisi)
7. [Kullanıcı Rolleri](#kullanıcı-rolleri)
8. [Kontrat Akışı](#kontrat-akışı)
9. [Hızlı Başlangıç — Sepolia (Kullanıcı)](#hızlı-başlangıç--sepolia-kullanıcı)
10. [Geliştirici Kurulumu — Localhost](#geliştirici-kurulumu--localhost)
11. [Sepolia'ya Deploy](#sepoliaya-deploy)
12. [Ortam Değişkenleri](#ortam-değişkenleri)
13. [Kullanılabilir Komutlar](#kullanılabilir-komutlar)
14. [Test Paketi](#test-paketi)
15. [Güvenlik Tasarımı](#güvenlik-tasarımı)
16. [Adres Senkronizasyon Sistemi](#adres-senkronizasyon-sistemi)

---

## Proje Hakkında

Geleneksel bağış platformlarında bağışçılar, bağladıkları fonların gerçekten amaçlandığı yere harcandığını doğrulamanın güvenilir bir yoluna sahip değildir. Bu proje, bu güven sorununu blokzinciri ile çözmeyi amaçlar:

- **Şeffaflık:** Tüm bağışlar ve ödemeler Ethereum'da herkese açık şekilde kayıtlıdır.
- **Demokratik denetim:** Harcama yapılabilmesi için bağışçıların oylarının çoğunluğu gerekir.
- **Otomatik icra:** Koşullar sağlandığında ödeme akıllı kontrat tarafından doğrudan tedarikçiye yapılır; araya giren bir üçüncü taraf yoktur.

---

## Özellikler

### Bağışçı Özellikleri
- **ETH bağışı** — MetaMask ile istenen miktarda ETH gönderme; 0.1 / 0.5 / 1 ETH hızlı seçim butonları.
- **Oylama** — Bağışçılar, yöneticinin oluşturduğu harcama taleplerine oy verebilir. Çifte oy (double-voting) koruması mevcuttur.
- **Kampanya önerme** — Herhangi bir bağlı cüzdan sahibi, onchain'e bir kampanya teklifi gönderebilir.
- **Canlı istatistikler** — Toplam bağışçı sayısı, kontrat bakiyesi ve aktif talep sayısı gerçek zamanlı güncellenir.

### Yönetici (Admin) Özellikleri
- **Harcama talebi oluşturma** — Tedarikçi adresi, açıklama ve ETH miktarı belirlenerek zincire talep açılır.
- **Finalize** — Bağışçıların %50'sinden fazlası onaylarsa yönetici ödemeyi tetikler; ETH doğrudan tedarikçiye gönderilir.
- **Kampanya teklifi yönetimi** — Gelen kampanya tekliflerini onaylama veya reddetme.
- **Özel admin banner** — Dashboard sayfasında yönetici cüzdanı bağlandığında özel panel görünür.

### Platform Özellikleri
- **İki sayfa mimarisi:** Landing/kampanya sayfası (herkese açık) + Dashboard (bağışçı & admin)
- **Blok bazlı otomatik yenileme** — Her yeni blokta tüm veriler otomatik güncellenir (`useBlockNumber` + `queryClient.invalidateQueries`)
- **İki ağ desteği** — Hardhat localhost (geliştirme) ve Sepolia testnet (canlı)
- **Post-deploy adres senkronizasyonu** — Deploy sonrası kontrat adresi `frontend/src/contract.ts` dosyasına otomatik yazılır.

---

## Teknoloji Yığını

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Akıllı kontrat | Solidity | 0.8.20 |
| Geliştirme ortamı | Hardhat | 3.x (viem tabanlı) |
| Deployment sistemi | Hardhat Ignition | ^3.1.2 |
| Testler | Node.js test runner + Chai | 34 entegrasyon testi |
| Frontend framework | React | 18.3.x |
| Build aracı | Vite | 5.4.x |
| Dil | TypeScript | 5.x |
| Routing | React Router | v7 |
| Blockchain istemcisi | Wagmi | v2.12.x |
| Düşük seviye Ethereum | Viem | v2.x |
| Sunucu durum yönetimi | TanStack Query | v5 |
| Cüzdan | MetaMask (injected connector) |  |
| Test ağı | Sepolia Testnet |  |
| Geliştirme ağı | Hardhat EDR (Simulated) |  |

---

## Proje Yapısı

```
blockchain-donation-platform/
│
├── contracts/
│   └── Charity.sol                  # Ana akıllı kontrat
│
├── test/
│   └── Charity.ts                   # 34 entegrasyon testi (6 grup)
│
├── scripts/
│   ├── interact.ts                  # Uçtan uca demo senaryosu
│   ├── sync-address.mjs             # Deploy sonrası adres senkronizasyon scripti
│   ├── deploy.ts                    # Alternatif deploy scripti
│   └── send-op-tx.ts                # Operasyonel işlem yardımcısı
│
├── ignition/
│   ├── modules/
│   │   └── Charity.ts               # Hardhat Ignition deployment modülü
│   └── deployments/
│       ├── chain-31337/             # Localhost deploy kayıtları
│       │   └── deployed_addresses.json
│       └── chain-11155111/          # Sepolia deploy kayıtları
│           └── deployed_addresses.json
│
├── frontend-exports/
│   ├── Charity.abi.json             # Kontrat ABI'si (JSON formatı)
│   └── config.ts                   # Kontrat adresi (dış kullanım için)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx                 # React uygulama giriş noktası
│       ├── App.tsx                  # Router, otomatik yenileme mantığı
│       ├── contract.ts              # CONTRACT_ADDRESS + CHARITY_ABI sabitleri
│       ├── wagmi.ts                 # Wagmi yapılandırması (hardhat + sepolia)
│       ├── campaignStore.ts         # Varsayılan kampanya tanımları
│       │
│       ├── pages/
│       │   ├── CampaignPage.tsx     # Landing sayfası (herkese açık)
│       │   └── DashboardPage.tsx    # Yönetici / bağışçı paneli
│       │
│       └── components/
│           ├── Header.tsx           # Navbar, cüzdan bağlantısı, sayfa navigasyonu
│           ├── HeroSection.tsx      # Ana sayfa hero bölümü
│           ├── CampaignCard.tsx     # Tek kampanya kartı
│           ├── Stats.tsx            # İstatistik kartları (bakiye, bağışçı, talep)
│           ├── DonateForm.tsx       # ETH bağış formu (hızlı seçim butonları dahil)
│           ├── CreateCampaignForm.tsx  # Kampanya teklif formu (emoji seçici)
│           ├── CreateRequestForm.tsx   # Harcama talebi oluşturma formu (sadece admin)
│           ├── RequestList.tsx      # Tüm taleplerin listesi
│           ├── RequestCard.tsx      # Tek talep kartı (oy çubuğu, aksiyon butonları)
│           └── CampaignProposalList.tsx  # Kampanya teklifleri yönetim paneli (admin)
│
├── hardhat.config.ts                # Hardhat ağ ve plugin yapılandırması
├── tsconfig.json                    # Root TypeScript yapılandırması
├── package.json                     # Root bağımlılıklar ve npm scriptleri
├── .env.example                     # Ortam değişkeni şablonu
└── .gitignore
```

---

## Akıllı Kontrat Detayları

### `contracts/Charity.sol`

Solidity 0.8.20 ile yazılmış, tüm platform mantığını içeren tek kontrat dosyası.

#### State Değişkenleri

| Değişken | Tip | Açıklama |
|----------|-----|----------|
| `manager` | `address` | Kontratı deploy eden hesap; yönetici yetkileri bu adrese aittir |
| `donations` | `mapping(address => uint256)` | Her adresin toplam bağış miktarı (wei cinsinden) |
| `hasVoted` | `mapping(uint256 => mapping(address => bool))` | `hasVoted[requestId][voter]` — çifte oy koruması için |
| `requests` | `Request[]` | Tüm harcama talepleri dizisi |
| `campaignProposals` | `CampaignProposal[]` | Tüm kampanya teklifleri dizisi |
| `totalDonors` | `uint256` | Benzersiz bağışçı sayısı (aynı adresin ikinci bağışı sayımı artırmaz) |
| `locked` | `bool` | Reentrancy guard için kilit bayrağı |

#### Struct Tanımları

**`Request`** — Harcama talebi:
```solidity
struct Request {
    string description;      // Harcama açıklaması
    address payable vendor;  // Ödeme yapılacak tedarikçi adresi
    uint256 amount;          // Talep edilen ETH miktarı (wei)
    uint256 votes;           // Gelen onay oyu sayısı
    bool completed;          // Ödeme gerçekleşti mi?
}
```

**`CampaignProposal`** — Kampanya teklifi:
```solidity
struct CampaignProposal {
    address proposer;    // Teklifi gönderen cüzdan adresi
    string title;        // Kampanya başlığı
    string description;  // Kampanya açıklaması
    string emoji;        // Kampanya emoji simgesi
    uint256 goalWei;     // Hedef bağış miktarı (wei)
    bool approved;       // Admin onayladı mı?
    bool rejected;       // Admin reddetti mi?
}
```

#### Fonksiyonlar

**Bağış:**

| Fonksiyon | Yetki | Açıklama |
|-----------|-------|----------|
| `donate()` | Herkes | ETH ile çağrılır (`payable`). Yeni bağışçı ise `totalDonors` artar. |

**Harcama Talebi:**

| Fonksiyon | Yetki | Açıklama |
|-----------|-------|----------|
| `createRequest(desc, vendor, amount)` | Sadece yönetici | Yeni harcama talebi açar. `amount`, anlık kontrat bakiyesini aşamaz. |
| `voteRequest(index)` | Sadece bağışçılar | Belirtilen talebe onay oyu verir. Tamamlanmış taleplere oy verilemez. |
| `finalizeRequest(index)` | Sadece yönetici | Oy çoğunluğu sağlandıysa tedarikçiye ETH transfer eder ve talebi kapatır. |

**Kampanya Yönetimi:**

| Fonksiyon | Yetki | Açıklama |
|-----------|-------|----------|
| `proposeCampaign(title, description, emoji, goalWei)` | Herkes | Zincire kampanya teklifi gönderir; admin onayı bekler. |
| `approveCampaign(index)` | Sadece yönetici | Teklifi onaylar; landing sayfasında görünür hale gelir. |
| `rejectCampaign(index)` | Sadece yönetici | Teklifi reddeder. |

**Getter (Okuma) Fonksiyonları:**

| Fonksiyon | Döndürür | Açıklama |
|-----------|----------|----------|
| `getBalance()` | `uint256` | Kontratın anlık ETH bakiyesi (wei) |
| `getRequestsCount()` | `uint256` | Toplam harcama talebi sayısı |
| `getRequest(index)` | `(description, vendor, amount, votes, completed)` | Belirtilen harcama talebinin tüm alanları |
| `getCampaignProposalsCount()` | `uint256` | Toplam kampanya teklifi sayısı |
| `getCampaignProposal(index)` | `(proposer, title, description, emoji, goalWei, approved, rejected)` | Belirtilen teklifin tüm alanları |

#### Modifier'lar

- **`onlyManager`** — `msg.sender == manager` değilse revert atar; `createRequest`, `finalizeRequest`, `approveCampaign`, `rejectCampaign` fonksiyonlarında kullanılır.
- **`nonReentrant`** — `locked` boolean ile reentrancy saldırılarını önler; yalnızca `finalizeRequest` fonksiyonunda kullanılır.

#### Eventler

| Event | Tetiklendiği Yer | Parametreler |
|-------|------------------|--------------|
| `Donated(donor, amount)` | `donate()` | Bağışçı adresi (indexed), miktar |
| `RequestCreated(requestId, description, vendor, amount)` | `createRequest()` | ID (indexed), açıklama, tedarikçi (indexed), miktar |
| `Voted(requestId, voter)` | `voteRequest()` | Talep ID (indexed), oy kullanan (indexed) |
| `RequestFinalized(requestId, vendor, amount)` | `finalizeRequest()` | ID (indexed), tedarikçi (indexed), miktar |
| `CampaignProposed(proposalId, proposer, title)` | `proposeCampaign()` | ID (indexed), öneren (indexed), başlık |
| `CampaignApproved(proposalId)` | `approveCampaign()` | ID (indexed) |
| `CampaignRejected(proposalId)` | `rejectCampaign()` | ID (indexed) |

#### Finalize Koşulu

```
req.votes > totalDonors / 2
```

Bağışçıların **salt çoğunluğu** (yarısından fazlası) onaylamış olmalıdır. Eşit durumda (örneğin 2 bağışçıdan 1 oy → `1 > 1` → false) finalize edilemez.

---

## Frontend Mimarisi

### Sayfa Yapısı

**`/` — CampaignPage (Landing)**
- Hero bölümü ve "Bağış Yap" butonuna kaydırma
- Onchain onaylı kampanyalar + `campaignStore`'daki varsayılan kampanyalar birleştirilerek gösterilir
- Herkese açık kampanya önerme formu (MetaMask bağlantısı gerekir)
- Bağış formu

**`/dashboard` — DashboardPage**
- Bağlı cüzdan yönetici ise admin banner görünür
- Canlı istatistikler (bakiye, bağışçı sayısı, talep sayısı)
- Bağış formu + Harcama talebi oluşturma formu (admin için aktif)
- Kampanya teklifleri yönetim paneli (sadece admin'e görünür)
- Tüm harcama taleplerinin listesi (oylama ve finalize butonları dahil)

### Otomatik Yenileme Mekanizması

`App.tsx` içindeki `useAutoRefresh` hook'u, `useBlockNumber({ watch: true })` ile yeni blokları izler. Her yeni blokta `queryClient.invalidateQueries()` çağrılarak tüm Wagmi/React Query önbelleği temizlenir ve veriler Ethereum'dan yeniden çekilir. Bu sayede kullanıcı sayfayı yenilemek zorunda kalmaz.

### Wagmi Yapılandırması (`frontend/src/wagmi.ts`)

- Desteklenen zincirler: `hardhat` (chain ID 31337) ve `sepolia` (chain ID 11155111)
- Hardhat için transport: `http://127.0.0.1:8545`
- Sepolia için transport: Varsayılan public RPC
- Connector: `injected()` (MetaMask)

---

## Kullanıcı Rolleri

| Rol | Kim | Sahip Olduğu Yetkiler |
|-----|-----|----------------------|
| **Yönetici** | Kontratı deploy eden hesap | Harcama talebi oluşturma, finalize tetikleme, kampanya tekliflerini onaylama/reddetme |
| **Bağışçı** | Daha önce en az bir kez `donate()` çağırmış hesap | Bağış yapma, açık taleplere oy kullanma |
| **Ziyaretçi** | Bağışı olmayan bağlı hesap | Kampanya önerme, bağış yapma (bağış yapınca bağışçı rolü kazanır) |
| **Bağlantısız** | Cüzdanı bağlanmamış kullanıcı | Yalnızca okuma; form alanları kilitlenir |

> Yönetici aynı zamanda bağışçı olabilir; iki rolü aynı anda taşımak geçerli bir durumdur.

---

## Kontrat Akışı

```
1. donate()
   ├─ Herhangi bir adres ETH gönderir
   ├─ donations[msg.sender] += value
   └─ Yeni bağışçıysa totalDonors++

2. createRequest()  [sadece yönetici]
   ├─ Tedarikçi adresi, açıklama ve miktar girilir
   └─ Yeni Request struct zincire yazılır

3. voteRequest()  [sadece bağışçılar]
   ├─ hasVoted[requestId][msg.sender] = true
   ├─ requests[index].votes++
   └─ Çifte oy koruması: daha önce oy verdiyse revert

4. finalizeRequest()  [sadece yönetici, nonReentrant]
   ├─ Koşul: req.votes > totalDonors / 2
   ├─ req.completed = true  (CEI pattern — önce durum güncelle)
   └─ vendor.call{value: req.amount}("")  (sonra transfer et)
```

---

## Hızlı Başlangıç — Sepolia (Kullanıcı)

Kontrat Sepolia'da canlı olduğu için yalnızca frontend'i başlatmak yeterlidir:

```bash
cd frontend
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç, MetaMask'ta **Sepolia** ağını seç ve cüzdanı bağla.

**Sepolia test ETH almak için:** `https://faucet.sepolia.dev` adresine git, Google hesabıyla giriş yap ve ücretsiz test ETH talep et.

---

## Geliştirici Kurulumu — Localhost

Yerel geliştirme için üç terminal gerekir:

```bash
# Adım 1: Root bağımlılıklarını yükle
npm install

# Adım 2: Frontend bağımlılıklarını yükle
cd frontend && npm install && cd ..
```

**Terminal 1 — Hardhat yerel node başlat:**
```bash
npm run node
```
Bu komut `http://127.0.0.1:8545` adresinde çalışan bir Hardhat EDR node'u başlatır ve 20 test hesabı oluşturur. Her hesapta 10.000 ETH bulunur.

**Terminal 2 — Kontratı deploy et:**
```bash
npm run deploy
```
Deploy tamamlandığında `scripts/sync-address.mjs` otomatik çalışır ve yeni kontrat adresini `frontend/src/contract.ts` dosyasına yazar.

**Terminal 3 — Frontend geliştirme sunucusunu başlat:**
```bash
cd frontend && npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç. MetaMask'ta **Localhost 8545** ağını ekle (Chain ID: 31337) ve Hardhat'ın ürettiği test hesaplarından birini import et.

---

## Sepolia'ya Deploy

**1. `.env` dosyasını oluştur** (`.env.example` şablonundan):
```env
SEPOLIA_PRIVATE_KEY=0xsenin_private_keyin
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

> Özel anahtarı asla kod deposuna commit etme. `.env` dosyası `.gitignore` tarafından görmezden gelinir.

**2. Deploy komutunu çalıştır:**
```bash
npm run deploy:sepolia
```

Deploy tamamlandığında `sync-address.mjs` scripti otomatik tetiklenerek yeni adres hem `frontend/src/contract.ts` hem de `frontend-exports/config.ts` dosyasına yazılır.

---

## Ortam Değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `SEPOLIA_PRIVATE_KEY` | Evet (Sepolia deploy için) | MetaMask'tan export edilen private key (`0x` önekiyle) |
| `SEPOLIA_RPC_URL` | Hayır | Sepolia RPC endpoint'i; boş bırakılırsa `https://rpc.sepolia.org` kullanılır |

`.env.example` dosyasını kopyala ve değerleri doldur:
```bash
cp .env.example .env
```

---

## Kullanılabilir Komutlar

### Root Komutlar

```bash
npm run compile           # Solidity kontratı derle; artifacts/ klasörünü güncelle
npm run test              # 34 entegrasyon testini çalıştır
npm run node              # Hardhat yerel node başlat (http://127.0.0.1:8545)
npm run deploy            # Localhost'a deploy et + adres senkronizasyonu
npm run deploy:sepolia    # Sepolia'ya deploy et + adres senkronizasyonu
npm run scenario          # Uçtan uca demo: bağış → talep → oylama → finalize
```

### Frontend Komutlar

```bash
cd frontend

npm run dev               # Vite geliştirme sunucusunu başlat (http://localhost:5173)
npm run build             # TypeScript derle + production build üret (dist/)
npm run preview           # Production build'i önizle
```

---

## Test Paketi

**Dosya:** `test/Charity.ts`  
**Toplam:** 34 entegrasyon testi  
**Çerçeve:** Hardhat 3 (viem tabanlı) + Node.js `node:test` + Chai

Her test grubu için `setup()` fonksiyonu çağrılarak taze bir kontrat deploy edilir; testler birbirini etkilemez.

### Test Grupları

| Grup | Test Sayısı | Kapsam |
|------|-------------|--------|
| **Deployment** | 4 | Manager atanması, başlangıç değerleri (totalDonors, bakiye, talep sayısı) |
| **donate()** | 6 | Geçerli bağış, `donations` mapping, `totalDonors` artışı, aynı kişi tekrar bağış, sıfır ETH reddi |
| **createRequest()** | 6 | Başarılı oluşturma, veri doğruluğu, yönetici olmayan reddi, sıfır adres, sıfır miktar, bakiye aşımı |
| **voteRequest()** | 6 | Bağışçı oyu, bağışçı olmayan reddi, çifte oy koruması, `hasVoted` mapping, tamamlanmış talep reddi, geçersiz ID |
| **finalizeRequest()** | 7 | Başarılı ödeme + bakiye değişimi, `completed` flag, yetersiz oy reddi, tekrar finalize reddi, yönetici olmayan reddi, geçersiz ID |
| **Köşe Durumlar** | 5 | Tek bağışçı senaryosu, yönetici aynı zamanda bağışçı, birden fazla bağımsız talep, bakiye aşımı güvenliği, çoklu bağışçı oy izleme |

### Örnek Test Çalıştırma

```bash
npm run test
```

Her test grubu bağımsız kontrat örneği kullanır; paralel çalışmaya uygundur.

---

## Güvenlik Tasarımı

### Reentrancy Koruması

`finalizeRequest` fonksiyonu hem `nonReentrant` modifier hem de CEI (Checks-Effects-Interactions) pattern kullanır:

```solidity
function finalizeRequest(uint256 _index) public onlyManager nonReentrant {
    // Checks
    require(!req.completed, "Bu odeme zaten yapildi");
    require(req.votes > totalDonors / 2, "...");
    require(address(this).balance >= req.amount, "...");

    // Effects  ← Durum değişikliği ÖNCE yapılır
    req.completed = true;

    // Interactions  ← Transfer EN SON gerçekleşir
    (bool success, ) = req.vendor.call{value: req.amount}("");
    require(success, "Transfer basarisiz");
}
```

### Çifte Oy Koruması

`hasVoted[requestId][voter]` mapping'i ile aynı adresin bir talebe birden fazla oy vermesi engellenir.

### Erişim Kontrolü

- `onlyManager` modifier: Harcama talebi ve kampanya yönetimi yalnızca deploy eden hesaba açık.
- Bağışçı doğrulaması: `donations[msg.sender] > 0` kontrolü; bağış yapmadan oy kullanılamaz.

### Bakiye Güvencesi

- `createRequest`: `_amount <= address(this).balance` — anlık bakiyeyi aşan talep açılamaz.
- `finalizeRequest`: `address(this).balance >= req.amount` — birden fazla talep aynı bakiyeyi kullanmaya çalışırsa ikincisi revert olur.

---

## Adres Senkronizasyon Sistemi

`scripts/sync-address.mjs` scripti, `npm run deploy` ve `npm run deploy:sepolia` komutlarının `postdeploy` ve `postdeploy:sepolia` hook'larıyla otomatik tetiklenir.

**Ne yapar?**
1. `ignition/deployments/chain-{chainId}/deployed_addresses.json` dosyasını okur.
2. `CharityModule#Charity` anahtarından yeni kontrat adresini alır.
3. `frontend/src/contract.ts` içindeki `CONTRACT_ADDRESS` satırını günceller.
4. `frontend-exports/config.ts` içindeki `CONTRACT_ADDRESS` satırını günceller.

**Sonuç:** Her yeni deploy sonrası `contract.ts` dosyasını manuel düzenlemeye gerek kalmaz.

```
npm run deploy
        ↓
hardhat ignition deploy ...
        ↓  (postdeploy hook)
node scripts/sync-address.mjs
        ↓
frontend/src/contract.ts → CONTRACT_ADDRESS güncellendi ✅
```
