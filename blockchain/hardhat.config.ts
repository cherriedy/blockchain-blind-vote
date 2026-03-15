import * as dotenv from "dotenv";
dotenv.config();

// @ts-ignore
import { defineConfig } from "hardhat/config";
// @ts-ignore
import "@nomicfoundation/hardhat-ethers";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";

export default defineConfig({
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    amoy: {
      type: "http",
      url: RPC_URL,
      accounts: ADMIN_PRIVATE_KEY ? [ADMIN_PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
});
