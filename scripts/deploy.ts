import { createWalletClient, createPublicClient, http } from "viem";
import { localhost } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

async function main() {
  console.log("Bağış kontratı (Charity) yükleniyor...");

  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const account = privateKeyToAccount(privateKey);

  // Yerel ağ için Chain ID'yi (31337) buraya sabitliyoruz
  const localChain = {
    ...localhost,
    id: 31337,
  };

  const walletClient = createWalletClient({
    account,
    chain: localChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const artifact = await hre.artifacts.readArtifact("Charity");

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
  });

  console.log("İşlem gönderildi, hash:", hash);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("=========================================");
  console.log("BAŞARILI!");
  console.log(`Kontrat Adresi: ${receipt.contractAddress}`);
  console.log("=========================================");
}

main().catch((error) => {
  if (error.details) console.error("Detay:", error.details);
  else console.error("Hata:", error);
  process.exitCode = 1;
});