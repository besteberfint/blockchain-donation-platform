/**
 * Tam senaryo: deploy → bağış → harcama talebi → oylama → finalize
 *
 * Çalıştırmak için:
 *   1. Terminal 1: npm run node   (hardhat local node)
 *   2. Terminal 2: npm run deploy (kontratı yükle)
 *   3. Terminal 2: npm run scenario
 */
import { parseEther, formatEther, getAddress } from "viem";
import { createWalletClient, createPublicClient, http } from "viem";
import { localhost } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

// Hardhat yerel ağı — chain ID 31337
const localChain = { ...localhost, id: 31337 };
const RPC = "http://127.0.0.1:8545";

// Hardhat #0 → manager (kontratı deploy eden), #1-#3 → bağışçılar, #4 → vendor
const PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // manager
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // donor1
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // donor2
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // donor3
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // vendor
] as const;

function makeClient(privateKey: string) {
  return createWalletClient({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain: localChain,
    transport: http(RPC),
  });
}

const publicClient = createPublicClient({ chain: localChain, transport: http(RPC) });
const [manager, donor1, donor2, donor3, vendor] = PRIVATE_KEYS.map(makeClient);

function sep(label: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${label}`);
  console.log("─".repeat(50));
}

async function getContract(contractAddress: `0x${string}`) {
  const artifact = await hre.artifacts.readArtifact("Charity");
  return { address: contractAddress, abi: artifact.abi } as const;
}

async function readBalance(contractAddress: `0x${string}`, label: string) {
  const bal = await publicClient.getBalance({ address: contractAddress });
  console.log(`  💰 ${label}: ${formatEther(bal)} ETH`);
}

async function main() {
  // ── 1. Kontrat adresini oku ──────────────────────────────────
  sep("1. Kontrat adresi");
  const deployments = await import(
    "../ignition/deployments/chain-31337/deployed_addresses.json",
    { with: { type: "json" } }
  );
  const rawAddress = (deployments as any).default["CharityModule#Charity"];
  if (!rawAddress) {
    throw new Error(
      "Kontrat adresi bulunamadı. Önce `npm run deploy` komutunu çalıştırın."
    );
  }
  const contractAddress = getAddress(rawAddress) as `0x${string}`;
  console.log(`  Adres: ${contractAddress}`);

  const contract = await getContract(contractAddress);

  // ── 2. Bağışlar ─────────────────────────────────────────────
  sep("2. Bağışlar");
  for (const [client, name, amount] of [
    [donor1, "Donor1", "3"],
    [donor2, "Donor2", "2"],
    [donor3, "Donor3", "1"],
  ] as const) {
    const hash = await client.writeContract({
      ...contract,
      functionName: "donate",
      value: parseEther(amount),
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✅ ${name} ${amount} ETH bağışladı`);
  }
  await readBalance(contractAddress, "Kontrat bakiyesi");

  // ── 3. Harcama talebi oluştur ────────────────────────────────
  sep("3. Harcama talebi oluşturma");
  const VENDOR_ADDRESS = vendor.account.address;
  const REQUEST_AMOUNT = parseEther("4");
  const hash3 = await manager.writeContract({
    ...contract,
    functionName: "createRequest",
    args: ["Okul insaati icin malzeme alimi", VENDOR_ADDRESS, REQUEST_AMOUNT],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash3 });
  console.log(`  ✅ Talep oluşturuldu: "Okul insaati icin malzeme alimi"`);
  console.log(`  📦 Miktar: ${formatEther(REQUEST_AMOUNT)} ETH → ${VENDOR_ADDRESS}`);

  // ── 4. Oylama ────────────────────────────────────────────────
  sep("4. Oylama (3 bağışçının 2'si onaylıyor)");
  for (const [client, name] of [
    [donor1, "Donor1"],
    [donor2, "Donor2"],
  ] as const) {
    const hash = await client.writeContract({
      ...contract,
      functionName: "voteRequest",
      args: [0n],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✅ ${name} oyu kullandı`);
  }

  // Oy sayısını oku
  const artifact = await hre.artifacts.readArtifact("Charity");
  const votes = await publicClient.readContract({
    ...contract,
    functionName: "getRequest",
    args: [0n],
  }) as [string, string, bigint, bigint, boolean];
  console.log(`  🗳️  Toplam oy: ${votes[3]} / 3 bağışçı`);

  // ── 5. Finalize ──────────────────────────────────────────────
  sep("5. Finalize (ödeme)");
  const vendorBalanceBefore = await publicClient.getBalance({ address: VENDOR_ADDRESS });

  const hash5 = await manager.writeContract({
    ...contract,
    functionName: "finalizeRequest",
    args: [0n],
  });
  await publicClient.waitForTransactionReceipt({ hash: hash5 });

  const vendorBalanceAfter = await publicClient.getBalance({ address: VENDOR_ADDRESS });
  const received = vendorBalanceAfter - vendorBalanceBefore;

  console.log(`  ✅ Ödeme tamamlandı!`);
  console.log(`  📤 Vendor aldı: ${formatEther(received)} ETH`);
  await readBalance(contractAddress, "Kontrat bakiyesi (kalan)");

  // ── 6. Özet ──────────────────────────────────────────────────
  sep("SENARYO TAMAMLANDI");
  console.log("  Tüm adımlar başarıyla çalıştı:");
  console.log("    ✔ 3 farklı bağışçı toplam 6 ETH bağışladı");
  console.log("    ✔ Yönetici 4 ETH'lik harcama talebi oluşturdu");
  console.log("    ✔ 2/3 bağışçı onayladı (çoğunluk sağlandı)");
  console.log("    ✔ Ödeme otomatik olarak vendor'a transfer edildi");
  console.log("    ✔ Her işlem blokzincirinde değiştirilemez şekilde kayıtlı");
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Hata:", err.shortMessage ?? err.message ?? err);
  process.exitCode = 1;
});
