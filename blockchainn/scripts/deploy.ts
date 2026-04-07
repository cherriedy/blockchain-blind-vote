import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying BlindBallotBox with account:", deployer.address);

  const factory = await ethers.getContractFactory("BlindBallotBox");
  const contract = await factory.deploy();

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  console.log("BlindBallotBox deployed to:", contract.target);
  console.log("Admin:", deployer.address);
  console.log("\nNext steps:");
  console.log("1. Call setRsaPublicKey(n, e) with the backend RSA public key.");
  console.log("2. Use castElectionVote or castPollVote with a valid signature.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
