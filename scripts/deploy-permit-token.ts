import { ethers } from "hardhat";

type Permit = {
  owner: string;
  spender: string;
  value: number | bigint;
  deadline: number;
};

async function main() {
  const tokenAddr = await deploy();

  const [ownerWallet, ...wallets] = await ethers.getSigners();

  const params: Permit = {
    owner: wallets[0].address,
    spender: wallets[1].address,
    value: ethers.parseEther("2"),
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hours
  };

  console.log("Deployer Address: ", ownerWallet.address);
  console.log("Spender Address: ", wallets[1].address);

  await permit(wallets[0], tokenAddr, params);
}

async function deploy() {
  const PermitToken = await ethers.getContractFactory("PermitToken");

  const permitToken = await PermitToken.deploy(ethers.parseEther("1000"));

  console.log("PermitToken deploy...");
  await permitToken.waitForDeployment();

  const addr = await permitToken.getAddress();

  console.log("PermitToken deployed to: ", addr);
  return addr;
}

async function permit(deployer: any, tokenAddr: string, params: Permit) {
  const { owner, spender, value, deadline } = params;

  const contract = await ethers.getContractAt("PermitToken", tokenAddr);

  const nonce = BigInt(await contract.nonces(owner));
  const network = await ethers.provider.getNetwork();

  const domain = {
    name: "PermitToken",
    version: "1",
    chainId: network.chainId,
    verifyingContract: tokenAddr,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const messages: Permit & { nonce: bigint } = {
    owner: owner,
    spender,
    value,
    deadline,
    nonce,
  };

  console.log("Message: ", messages);

  const signature = await deployer.signTypedData(domain, types, messages);

  const sig = await ethers.Signature.from(signature);

  const tx = await contract.permit(
    owner,
    spender,
    value,
    deadline,
    sig.v,
    sig.r,
    sig.s
  );
  await tx.wait();

  //Mint 2 ethers for owner account
  await contract.mint(owner, ethers.parseEther("2"));

  console.log("Allowance: ", await contract.allowance(owner, spender));

  //Spender tranfer 0.000001 ether from owner account to his account
  await contract
    .connect(await ethers.getSigner(spender))
    .transferFrom(owner, spender, ethers.parseEther("0.000001"));

  //Owner transfer 1 ether to spender account
  await contract
    .connect(await ethers.getSigner(owner))
    .transfer(spender, ethers.parseEther("1"));

  console.log("Allowance: ", await contract.allowance(owner, spender));
}

main().catch(console.error);
