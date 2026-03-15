const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying BlindBallotBox with account:", deployer.address);

  const BlindBallotBox = await hre.ethers.getContractFactory("BlindBallotBox");
  const contract = await BlindBallotBox.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("BlindBallotBox deployed to:", address);
  console.log("\nAdmin:", deployer.address);
  console.log("\n── Next steps ───────────────────────────────────────────────");
  console.log("1. Set RSA public key (from GET /voting/public-key):");
  console.log("   setRsaPublicKey(n, e)");
  console.log("");
  console.log("2. Set CONTRACT_ADDRESS in backend .env:");
  console.log("  ", address);
  console.log("─────────────────────────────────────────────────────────────");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

