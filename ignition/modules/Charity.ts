import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CharityModule", (m) => {
  const charity = m.contract("Charity");
  return { charity };
});
