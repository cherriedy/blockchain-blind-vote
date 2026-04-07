import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("BlindBallotBox", function () {
  it("should initialize admin to deployer", async function () {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.deployContract("BlindBallotBox");

    expect(await contract.admin()).to.equal(deployer.address);
  });

  it("should allow admin to set RSA public key", async function () {
    const contract = await ethers.deployContract("BlindBallotBox");
    const n = ethers.randomBytes(256);
    const nHex = ethers.hexlify(n);
    const e = 65537;

    await expect(contract.setRsaPublicKey(nHex, e))
      .to.emit(contract, "RsaPublicKeySet")
      .withArgs(nHex, BigInt(e));

    expect(await contract.rsaN()).to.equal(nHex);
    expect(await contract.rsaE()).to.equal(BigInt(e));
  });

  it("should revert when non-admin tries to set RSA public key", async function () {
    const [, other] = await ethers.getSigners();
    const contract = await ethers.deployContract("BlindBallotBox");
    const n = ethers.randomBytes(256);

    await expect(contract.connect(other).setRsaPublicKey(n, 65537)).to.be.revertedWith(
      "BlindBallotBox: caller is not the admin"
    );
  });

  it("should revert castElectionVote when key is not set", async function () {
    const contract = await ethers.deployContract("BlindBallotBox");
    const eventId = ethers.keccak256(ethers.toUtf8Bytes("event"));
    const candidateId = ethers.keccak256(ethers.toUtf8Bytes("candidate"));
    const message = "0x" + "00".repeat(31) + "01";
    const signature = "0x" + "00".repeat(256);

    await expect(
      contract.castElectionVote(eventId, candidateId, message, signature)
    ).to.be.revertedWith("BlindBallotBox: RSA public key not set");
  });

  it("should hash MongoDB ids consistently", async function () {
    const contract = await ethers.deployContract("BlindBallotBox");
    const id = "64123abcde1234567890abcd";
    expect(await contract.hashMongoId(id)).to.equal(ethers.keccak256(ethers.toUtf8Bytes(id)));
  });
});
