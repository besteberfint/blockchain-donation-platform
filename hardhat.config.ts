import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";

export default defineConfig({
  solidity: "0.8.20",
  networks: {
    hardhat: {
      type: "edr-simulated" // HHE15 hatasını çözen kritik satır
    },
    // Sepolia'yı şu anlık devre dışı bırakıyoruz ki hata vermesin
  },
});