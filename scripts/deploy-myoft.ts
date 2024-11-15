import { Options } from "@layerzerolabs/lz-v2-utilities";
import { AbiCoder, BytesLike } from "ethers";
import { ethers } from "hardhat";
import { MessagingFeeStruct } from "~/typechain-types/contracts/MyOApp";
import {
  EnforcedOptionParamStruct,
  MyOFT2,
  SendParamStruct,
} from "~/typechain-types/contracts/MyOFT2";

const LZ_ENDPOINT_ADDRESS = "0x6EDCE65403992e310A62460808c4b910D972f10f";
const SEPOLIA_ENDPOINT_ID = 40161;
const BASE_SEPOLIA_ENDPOINT_ID = 40245;
const OWNER = process.env.OWNER!;

async function main() {
  // let tokenName = "TokenB",
  //   tokenSymb = "TB";
  // await deploy(tokenName, tokenSymb);

  // await connectPeer(
  //   "0xBad1cf3DE7551e71Ed0D61f21616F8F52beBd3B2",
  //   "0x7E58894e4267d191D039Abb174fbaD304C33de8c",
  //   SEPOLIA_ENDPOINT_ID
  // );

  // await connectPeer(
  //   "0x7E58894e4267d191D039Abb174fbaD304C33de8c",
  //   "0xBad1cf3DE7551e71Ed0D61f21616F8F52beBd3B2",
  //   BASE_SEPOLIA_ENDPOINT_ID
  // );

  await sendMessage(
    "0xBad1cf3DE7551e71Ed0D61f21616F8F52beBd3B2",
    0.5,
    SEPOLIA_ENDPOINT_ID
  );
}

async function deploy(name: string, symbol: string) {
  const [deployer] = await ethers.getSigners();
  const MyOFT2 = await ethers.getContractFactory("MyOFT2");
  const myOFT2 = await MyOFT2.deploy(
    name,
    symbol,
    LZ_ENDPOINT_ADDRESS,
    deployer.address
  );

  console.log(`Deploy ${name}`);
  await myOFT2.waitForDeployment();

  const addr = await myOFT2.getAddress();
  console.log("Address deploy to: ", addr);
}

async function connectPeer(sourceAddr: string, destAddr: string, id: number) {
  const contract = await ethers.getContractAt("MyOFT2", sourceAddr);

  const peer = ethers.zeroPadValue(destAddr, 32);
  await contract.setPeer(id, peer);

  const isConnected = await contract.isPeer(id, peer);
  console.log(`Address ${sourceAddr} connected to ${destAddr}: ${isConnected}`);
}

async function grantAccess(addr: string, amount: bigint | number) {
  const [deployer] = await ethers.getSigners();

  const contract = await ethers.getContractAt("MyOFT2", deployer);

  await contract.approve(addr, amount);
}

async function setEnforcedOptions(adapter: MyOFT2, options: BytesLike) {
  const enforceOptions: EnforcedOptionParamStruct = {
    eid: SEPOLIA_ENDPOINT_ID,
    msgType: 1,
    options: options,
  };
  await adapter.setEnforcedOptions([enforceOptions]);
}

async function send(
  contractName: "MyOFT2",
  sourceAddr: string,
  destAddr: string,
  sendAmount: bigint | number,
  eid: number
) {
  const adapter = await ethers.getContractAt(contractName, sourceAddr);

  const amount = ethers.parseEther(sendAmount.toString());

  // Defining extra message execution options for the send operation
  let options = Options.newOptions()
    .addExecutorLzReceiveOption(65000, 0)
    .toHex();

  await setEnforcedOptions(adapter, options);

  try {
    // const sendParam: SendParamStruct = {
    //   dstEid: SEPOLIA_ENDPOINT_ID,
    //   to: ethers.zeroPadValue(destAddr, 32),
    //   amountLD: amount,
    //   minAmountLD: amount,
    //   extraOptions: options,
    //   composeMsg: "0x",
    //   oftCmd: "0x",
    // };

    // console.log("Send Param: ", sendParam);

    // const messagingFee: MessagingFeeStruct = {
    //   nativeFee: Number(gasFee),
    //   lzTokenFee: 0,
    // };

    const encodedData = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256"], // Types for encoding
      [destAddr, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", amount] // Values to encode
    );

    const gasFee = await adapter.quote(eid, encodedData, options, false);

    console.log("Native Fee: ", gasFee[0]);

    const tx = await adapter.sendTransfer(
      eid,
      destAddr,
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      amount,
      options,
      {
        value: gasFee[0],
      }
    );

    console.log(
      `Send tx initiated. See: https://layerzeroscan.com/tx/${tx.hash}`
    );
  } catch (error) {
    console.error("Error during transaction:", error);
  }
}

const sendMessage = async (
  sourceAddr: string,
  amount: bigint | number,
  destId: number
) => {
  const [owner] = await ethers.getSigners();
  const artifact = await ethers.getContractFactory("MyOFT2");

  const payload = artifact.interface.encodeFunctionData("transfer(address,address,uint256)", [
    owner.address,
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ethers.parseEther(amount.toString()),
  ]);

  const adapter = await ethers.getContractAt("MyOFT2", sourceAddr);

  const options = Options.newOptions()
    .addExecutorLzReceiveOption(65000, 0)
    .toHex();

  await setEnforcedOptions(adapter, options);

  const gasFee = await adapter.quote(destId, payload, options, false);

  console.log("Native Fee: ", gasFee[0]);

  const tx = await adapter.sendMessage(destId, payload, options, {
    value: gasFee[0],
  });

  console.log(
    `Send tx initiated. See: https://layerzeroscan.com/tx/${tx.hash}`
  );
};

main().catch(console.error);
