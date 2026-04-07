import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const contractAddress = "0x7b408a675A98b16FF642a11Da5B9C15fe55D03b9";

  const contract = await ethers.getContractAt("BlindBallotBox", contractAddress);

  // LẤY từ backend (RSA đang dùng để ký)
  const n = "0xbf3d167f6dafa34cbae0adc97ceb0aa7f548ec871ba347499c4c6a552ec003c761a08facbad504a2a39ea84817d64402f38e1b006ef59e24c7bc72838c702988a71201c5fcc519f992d84c1559d39f13dd48f51e5a5f7f4cb1d22fc35e88d15e202dc8db19031f3daab614f25336f2c0f6446be98331746068c5f6d937965b9edb57d6a774ce454b3d5bff0c186c81c75dfb973794714a485c9a1fd3c1d4d25038dd859bf6c13cc99214843f241a4ddce59b69433f54fbbaaa5ddd52eb7abaaffcd37d43f7cfb4e72d95691071da8e8dbfae96a8c43b8de34d3dfec541dc309ce318b1a8ac961f8e5488c450ea4df8e312b2477b0cc49eb9f4ab7033eb34b857";
  const e = 0x10001;

  const tx = await contract.setRsaPublicKey(n, e);
  await tx.wait();

  console.log("RSA key set thành công");
}

main();