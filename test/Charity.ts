import { expect } from "chai";
import hre from "hardhat";
import { describe, it } from "node:test"; // Node.js'in kendi test aracını çağırdık

describe("Charity", function () {
  it("Bağış yapıldığında bakiye artmalı", async function () {
    // Kontratı ayağa kaldır
    const charity = await hre.viem.deployContract("Charity");
    const publicClient = await hre.viem.getPublicClient();

    // 1 ETH bağış yapalım (Wei cinsinden)
    const bagisMiktari = BigInt(1000000000000000000); 
    
    await charity.write.donate({ value: bagisMiktari });

    // Kontratın bakiyesini kontrol et
    const balance = await publicClient.getBalance({ 
      address: charity.address 
    });

    expect(balance).to.equal(bagisMiktari);
  });
});