import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// npm postdeploy hook'u her zaman proje kökünden çalışır
const root = process.cwd()

const deployedPath = resolve(root, 'ignition/deployments/chain-31337/deployed_addresses.json')

let deployed
try {
  // BOM karakterini temizle (UTF-8 BOM: ﻿)
  const raw = readFileSync(deployedPath, 'utf8').replace(/^﻿/, '')
  deployed = JSON.parse(raw)
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('❌ deployed_addresses.json bulunamadı — önce npm run deploy çalıştırın.')
  } else {
    console.error('❌ deployed_addresses.json okunamadı:', err.message)
  }
  process.exit(1)
}

const address = deployed['CharityModule#Charity']
if (!address) {
  console.error('❌ deployed_addresses.json içinde CharityModule#Charity anahtarı yok.')
  process.exit(1)
}

const FILES = [
  {
    path: resolve(root, 'frontend/src/contract.ts'),
    // export const CONTRACT_ADDRESS: Address = '0x...'
    regex: /export const CONTRACT_ADDRESS: Address = '0x[0-9a-fA-F]+'/m,
    replacement: `export const CONTRACT_ADDRESS: Address = '${address}'`,
  },
  {
    path: resolve(root, 'frontend-exports/config.ts'),
    // export const CONTRACT_ADDRESS = "0x..."; // local
    regex: /export const CONTRACT_ADDRESS = "0x[0-9a-fA-F]+"/m,
    replacement: `export const CONTRACT_ADDRESS = "${address}"`,
  },
]

for (const { path: filePath, regex, replacement } of FILES) {
  const rel = filePath.replace(root, '').slice(1)
  const content = readFileSync(filePath, 'utf8')
  if (!regex.test(content)) {
    console.warn(`⚠️  ${rel} — CONTRACT_ADDRESS satırı bulunamadı, elle güncelleyin.`)
    continue
  }
  const patched = content.replace(regex, replacement)
  if (patched === content) {
    console.log(`ℹ️  ${rel} — adres zaten güncel.`)
    continue
  }
  writeFileSync(filePath, patched)
  console.log(`✅ ${rel} güncellendi`)
}

console.log(`\n   Kontrat adresi: ${address}\n`)
