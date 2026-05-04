import { expect } from "chai";
import hre from "hardhat";
import { describe, it } from "node:test";
import { parseEther } from "viem";

// Hardhat 3 API: viem, hre.network.create() üzerinden geliyor
async function getViem() {
  const { viem } = await hre.network.create();
  return viem;
}

// Bir işlemin revert etmesini bekleyen yardımcı
async function expectRevert(fn: () => Promise<unknown>): Promise<void> {
  let reverted = false;
  try {
    await fn();
  } catch {
    reverted = true;
  }
  expect(reverted, "Bu işlemin revert etmesi bekleniyordu").to.be.true;
}

// Her test için taze kontrat + wallet client'lar döner
async function setup() {
  const viem = await getViem();
  const wallets = await viem.getWalletClients();
  const [manager, donor1, donor2, donor3, vendor] = wallets;
  const charity = await viem.deployContract("Charity");
  const publicClient = await viem.getPublicClient();

  const asManager = charity;
  const asDonor1 = await viem.getContractAt("Charity", charity.address, {
    client: { wallet: donor1 },
  });
  const asDonor2 = await viem.getContractAt("Charity", charity.address, {
    client: { wallet: donor2 },
  });
  const asDonor3 = await viem.getContractAt("Charity", charity.address, {
    client: { wallet: donor3 },
  });

  return { viem, charity, asManager, asDonor1, asDonor2, asDonor3, manager, donor1, donor2, donor3, vendor, publicClient };
}

// ─────────────────────────────────────────────
// 1. DEPLOYMENT
// ─────────────────────────────────────────────
describe("Deployment", function () {
  it("Kontratı deploy eden kişi manager olmalı", async function () {
    const { charity, manager } = await setup();
    const storedManager = await charity.read.manager();
    expect(storedManager.toLowerCase()).to.equal(manager.account.address.toLowerCase());
  });

  it("Başlangıçta totalDonors sıfır olmalı", async function () {
    const { charity } = await setup();
    expect(await charity.read.totalDonors()).to.equal(0n);
  });

  it("Başlangıçta kontrat bakiyesi sıfır olmalı", async function () {
    const { charity } = await setup();
    expect(await charity.read.getBalance()).to.equal(0n);
  });

  it("Başlangıçta harcama talebi sayısı sıfır olmalı", async function () {
    const { charity } = await setup();
    expect(await charity.read.getRequestsCount()).to.equal(0n);
  });
});

// ─────────────────────────────────────────────
// 2. BAĞIŞ — donate()
// ─────────────────────────────────────────────
describe("donate()", function () {
  it("Geçerli bağış kontrat bakiyesini artırmalı", async function () {
    const { asDonor1 } = await setup();
    await asDonor1.write.donate({ value: parseEther("2") });
    const balance = await asDonor1.read.getBalance();
    expect(balance).to.equal(parseEther("2"));
  });

  it("donations mapping doğru güncellenebilmeli", async function () {
    const { asDonor1, donor1 } = await setup();
    await asDonor1.write.donate({ value: parseEther("1.5") });
    const donated = await asDonor1.read.donations([donor1.account.address]);
    expect(donated).to.equal(parseEther("1.5"));
  });

  it("İlk bağış totalDonors'u 1 artırmalı", async function () {
    const { charity, asDonor1 } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    expect(await charity.read.totalDonors()).to.equal(1n);
  });

  it("Aynı kişinin ikinci bağışı totalDonors'u değiştirmemeli", async function () {
    const { charity, asDonor1 } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asDonor1.write.donate({ value: parseEther("0.5") });
    expect(await charity.read.totalDonors()).to.equal(1n);
  });

  it("Birden fazla farklı bağışçı totalDonors'u doğru artırmalı", async function () {
    const { charity, asDonor1, asDonor2, asDonor3 } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asDonor2.write.donate({ value: parseEther("1") });
    await asDonor3.write.donate({ value: parseEther("1") });
    expect(await charity.read.totalDonors()).to.equal(3n);
  });

  it("0 ETH bağış reddedilmeli", async function () {
    const { asDonor1 } = await setup();
    await expectRevert(() => asDonor1.write.donate({ value: 0n }));
  });
});

// ─────────────────────────────────────────────
// 3. HARCAMA TALEBİ — createRequest()
// ─────────────────────────────────────────────
describe("createRequest()", function () {
  it("Yönetici harcama talebi oluşturabilmeli", async function () {
    const { charity, asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });
    await asManager.write.createRequest(["Okul inşaatı", vendor.account.address, parseEther("1")]);
    expect(await charity.read.getRequestsCount()).to.equal(1n);
  });

  it("Talep verileri doğru kaydedilmeli", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });
    await asManager.write.createRequest(["Ilac alimi", vendor.account.address, parseEther("2")]);
    const [desc, , amount, votes, completed] = await asManager.read.getRequest([0n]);
    expect(desc).to.equal("Ilac alimi");
    expect(amount).to.equal(parseEther("2"));
    expect(votes).to.equal(0n);
    expect(completed).to.be.false;
  });

  it("Yönetici olmayan talep oluşturamamalı", async function () {
    const { asDonor1, asDonor2, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });
    await expectRevert(() =>
      asDonor2.write.createRequest(["Okul insaati", vendor.account.address, parseEther("1")])
    );
  });

  it("Sıfır adres vendor reddedilmeli", async function () {
    const { asManager, asDonor1 } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });
    await expectRevert(() =>
      asManager.write.createRequest([
        "Test",
        "0x0000000000000000000000000000000000000000",
        parseEther("1"),
      ])
    );
  });

  it("Sıfır miktarlı talep reddedilmeli", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });
    await expectRevert(() =>
      asManager.write.createRequest(["Test", vendor.account.address, 0n])
    );
  });

  it("Kontrat bakiyesinden fazla miktarlı talep reddedilmeli", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await expectRevert(() =>
      asManager.write.createRequest(["Test", vendor.account.address, parseEther("10")])
    );
  });
});

// ─────────────────────────────────────────────
// 4. OYLAMA — voteRequest()
// ─────────────────────────────────────────────
describe("voteRequest()", function () {
  it("Bağışçı talebe oy verebilmeli", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Okul insaati", vendor.account.address, parseEther("0.5")]);
    await asDonor1.write.voteRequest([0n]);
    const [, , , votes] = await asManager.read.getRequest([0n]);
    expect(votes).to.equal(1n);
  });

  it("Bağışçı olmayan oy kullanamamalı", async function () {
    const { asManager, asDonor1, asDonor2, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Okul insaati", vendor.account.address, parseEther("0.5")]);
    await expectRevert(() => asDonor2.write.voteRequest([0n]));
  });

  it("Aynı kişi iki kez oy veremez (double voting koruması)", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Okul insaati", vendor.account.address, parseEther("0.5")]);
    await asDonor1.write.voteRequest([0n]);
    await expectRevert(() => asDonor1.write.voteRequest([0n]));
  });

  it("hasVoted mapping doğru güncellenmeli", async function () {
    const { asManager, asDonor1, donor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Okul insaati", vendor.account.address, parseEther("0.5")]);
    await asDonor1.write.voteRequest([0n]);
    const voted = await asManager.read.hasVoted([0n, donor1.account.address]);
    expect(voted).to.be.true;
  });

  it("Tamamlanmış talebe oy verilememeli", async function () {
    const { asManager, asDonor1, asDonor2, asDonor3, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asDonor2.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Ilac alimi", vendor.account.address, parseEther("1")]);
    await asDonor1.write.voteRequest([0n]);
    await asDonor2.write.voteRequest([0n]);
    await asManager.write.finalizeRequest([0n]);
    // Talep tamamlandı, donor3 oy veremez
    await asDonor3.write.donate({ value: parseEther("1") });
    await expectRevert(() => asDonor3.write.voteRequest([0n]));
  });

  it("Geçersiz talep ID ile oy kullanılamamalı", async function () {
    const { asDonor1 } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await expectRevert(() => asDonor1.write.voteRequest([999n]));
  });
});

// ─────────────────────────────────────────────
// 5. FİNALİZE — finalizeRequest()
// ─────────────────────────────────────────────
describe("finalizeRequest()", function () {
  it("Yeterli oy sonrası ödeme yapılmalı ve vendor bakiyesi artmalı", async function () {
    const { asManager, asDonor1, asDonor2, vendor, publicClient } = await setup();
    await asDonor1.write.donate({ value: parseEther("2") });
    await asDonor2.write.donate({ value: parseEther("2") });
    await asManager.write.createRequest(["Ilac alimi", vendor.account.address, parseEther("1")]);
    await asDonor1.write.voteRequest([0n]);
    await asDonor2.write.voteRequest([0n]);

    const balanceBefore = await publicClient.getBalance({ address: vendor.account.address });
    await asManager.write.finalizeRequest([0n]);
    const balanceAfter = await publicClient.getBalance({ address: vendor.account.address });

    expect(balanceAfter - balanceBefore).to.equal(parseEther("1"));
  });

  it("Finalize sonrası kontrat bakiyesi azalmalı", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("2")]);
    await asDonor1.write.voteRequest([0n]);
    await asManager.write.finalizeRequest([0n]);
    expect(await asManager.read.getBalance()).to.equal(parseEther("3"));
  });

  it("Finalize sonrası talep completed=true olmalı", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("2") });
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("1")]);
    await asDonor1.write.voteRequest([0n]);
    await asManager.write.finalizeRequest([0n]);
    const [, , , , completed] = await asManager.read.getRequest([0n]);
    expect(completed).to.be.true;
  });

  it("Yetersiz oy ile finalize edilememeli (%50 eşit — geçmez)", async function () {
    const { asManager, asDonor1, asDonor2, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asDonor2.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("1")]);
    // 1 oy → 1 > 2/2 yani 1 > 1 → false → revert
    await asDonor1.write.voteRequest([0n]);
    await expectRevert(() => asManager.write.finalizeRequest([0n]));
  });

  it("Tamamlanmış talep tekrar finalize edilememeli", async function () {
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("2") });
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("1")]);
    await asDonor1.write.voteRequest([0n]);
    await asManager.write.finalizeRequest([0n]);
    await expectRevert(() => asManager.write.finalizeRequest([0n]));
  });

  it("Yönetici olmayan finalize edememeli", async function () {
    const { asManager, asDonor1, asDonor2, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("2") });
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("1")]);
    await asDonor1.write.voteRequest([0n]);
    await expectRevert(() => asDonor2.write.finalizeRequest([0n]));
  });

  it("Geçersiz talep ID ile finalize edilememeli", async function () {
    const { asManager } = await setup();
    await expectRevert(() => asManager.write.finalizeRequest([999n]));
  });
});

// ─────────────────────────────────────────────
// 6. KÖŞE DURUMLAR
// ─────────────────────────────────────────────
describe("Köşe Durumlar", function () {
  it("Tek bağışçı kendi talebini onaylayabilmeli (eşik: votes > 0)", async function () {
    // totalDonors=1 → totalDonors/2=0 → votes(1) > 0 → geçer
    const { asManager, asDonor1, vendor, publicClient } = await setup();
    await asDonor1.write.donate({ value: parseEther("2") });
    await asManager.write.createRequest(["Tek bagisci testi", vendor.account.address, parseEther("1")]);
    await asDonor1.write.voteRequest([0n]);

    const before = await publicClient.getBalance({ address: vendor.account.address });
    await asManager.write.finalizeRequest([0n]);
    const after = await publicClient.getBalance({ address: vendor.account.address });
    expect(after - before).to.equal(parseEther("1"));
  });

  it("Yönetici bağış yapıp oy kullanabilmeli", async function () {
    // Manager hem yönetici hem de bağışçı olabilir; bu geçerli bir senaryo
    const { asManager, manager, asDonor1, vendor } = await setup();
    // Manager bağış yapıyor
    await asManager.write.donate({ value: parseEther("1") });
    await asDonor1.write.donate({ value: parseEther("1") });
    // totalDonors = 2
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("1")]);
    // Her ikisi de oy veriyor → 2 > 1 → geçer
    await asManager.write.voteRequest([0n]);
    await asDonor1.write.voteRequest([0n]);
    await asManager.write.finalizeRequest([0n]);
    const [, , , , completed] = await asManager.read.getRequest([0n]);
    expect(completed).to.be.true;
  });

  it("Birden fazla bağımsız talep doğru çalışmalı", async function () {
    const { asManager, asDonor1, asDonor2, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("3") });
    await asDonor2.write.donate({ value: parseEther("3") });

    // İki ayrı talep
    await asManager.write.createRequest(["Talep A", vendor.account.address, parseEther("1")]);
    await asManager.write.createRequest(["Talep B", vendor.account.address, parseEther("1")]);

    // Her bağışçı sadece Talep A'ya oy veriyor
    await asDonor1.write.voteRequest([0n]);
    await asDonor2.write.voteRequest([0n]);

    // Talep A finalize edilebilir
    await asManager.write.finalizeRequest([0n]);
    const [, , , , completedA] = await asManager.read.getRequest([0n]);
    expect(completedA).to.be.true;

    // Talep B henüz oy almadı, finalize edilemez
    await expectRevert(() => asManager.write.finalizeRequest([1n]));
    const [, , , , completedB] = await asManager.read.getRequest([1n]);
    expect(completedB).to.be.false;
  });

  it("Bakiyeyi aşan ikinci talep finalize'da güvenle reddedilmeli", async function () {
    // Tasarım notu: createRequest bakiye kontrolü anlık yapar; eşzamanlı talepler
    // birbirinin bakiyesini düşürebilir. finalizeRequest'teki kontrol bunu engeller.
    const { asManager, asDonor1, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("5") });

    // Her iki talep de şu an geçerli (5 ETH bakiye var)
    await asManager.write.createRequest(["Talep 1", vendor.account.address, parseEther("4")]);
    await asManager.write.createRequest(["Talep 2", vendor.account.address, parseEther("4")]);

    await asDonor1.write.voteRequest([0n]);
    await asDonor1.write.voteRequest([1n]);

    // İlk talep finalize edilir → bakiye 1 ETH kalır
    await asManager.write.finalizeRequest([0n]);
    expect(await asManager.read.getBalance()).to.equal(parseEther("1"));

    // İkinci talep: bakiye (1 ETH) < talep miktarı (4 ETH) → güvenle revert
    await expectRevert(() => asManager.write.finalizeRequest([1n]));
  });

  it("Birden fazla bağışçının oyları bağımsız olarak izlenmeli", async function () {
    const { asManager, asDonor1, asDonor2, donor1, donor2, vendor } = await setup();
    await asDonor1.write.donate({ value: parseEther("1") });
    await asDonor2.write.donate({ value: parseEther("1") });
    await asManager.write.createRequest(["Test", vendor.account.address, parseEther("1")]);

    await asDonor1.write.voteRequest([0n]);
    // donor1 oy verdi, donor2 vermedi
    expect(await asManager.read.hasVoted([0n, donor1.account.address])).to.be.true;
    expect(await asManager.read.hasVoted([0n, donor2.account.address])).to.be.false;

    await asDonor2.write.voteRequest([0n]);
    expect(await asManager.read.hasVoted([0n, donor2.account.address])).to.be.true;
  });
});
