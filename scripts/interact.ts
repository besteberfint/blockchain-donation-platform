import { createWalletClient, createPublicClient, http, parseEther, formatEther, getAddress } from "viem";
import { localhost } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

async function main() {
  // 1. Adresi Viem'in istediği Checksum formatına sokuyoruz
  const contractAddress = getAddress("0x5FbDB2315678afecb367f032d93f642f64180aa3");
  
  // 2. Kontratın ABI bilgilerini Hardhat üzerinden okuyoruz
  const artifact = await hre.artifacts.readArtifact("Charity");

  // 3. İşlem yapacak hesabı (Hardhat #0) tanımlıyoruz
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const account = privateKeyToAccount(privateKey);

  // 4. Ağ bağlantılarını (Client) kuruyoruz
  const localChain = { ...localhost, id: 31337 };

  const client = createWalletClient({
    account,
    chain: localChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http("http://127.0.0.1:8545"),
  });

  console.log("-----------------------------------------");
  console.log("1 ETH bağış gönderiliyor...");

  try {
    // 5. Kontratın 'donate' fonksiyonunu tetikliyoruz
    const hash = await client.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: "donate",
      value: parseEther("1"), // 1 ETH'yi Wei birimine çevirir
    });

    // 6. İşlemin blokzincirine yazılmasını bekliyoruz
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Bağış başarılı!");
    console.log(`İşlem Hash: ${hash}`);

    // 7. Kontratın içindeki toplam parayı kontrol ediyoruz
    const balance = await publicClient.getBalance({ address: contractAddress });
    console.log(`💰 Kontratın güncel bakiyesi: ${formatEther(balance)} ETH`);
    console.log("-----------------------------------------");
    
  } catch (error: any) {
    console.error("❌ Bir hata oluştu:");
    if (error.details) {
      console.error(error.details);
    } else {
      console.error(error);
    }
  }
}

main().catch(console.error);