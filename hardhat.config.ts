import { task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";

// This adds support for typescript paths mappings
import "tsconfig-paths/register";
import * as dotenv from "dotenv";

dotenv.config();

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, { ethers }) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);

    console.log(ethers.formatEther(balance), "ETH");
  });

// task action function receives the Hardhat Runtime Environment as second argument
task(
  "blockNumber",
  "Prints the current block number",
  async (_, { ethers }) => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Current block number: " + blockNumber);
  }
);

task("hello", "Prints a greeting")
  .addOptionalParam("a", "The a to print", "1")
  .addOptionalParam("b", "The b to print", "1")
  .setAction(async ({ a, b }) => console.log(+a + +b));

const config = {
  solidity: {
    compilers: [
      {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
            details: {
              yul: false,
            },
          },
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  networks: {
    base_sepolia: {
      accounts: [process.env.PRIVATE_KEY!],
      url: "https://sepolia.base.org",
      chainId: 84532,
      eid: 40245,
    },
    sepolia: {
      accounts: [process.env.PRIVATE_KEY!],
      url: "https://sepolia.drpc.org",
      chainId: 11155111,
      eid: 40161,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASE_SEPOLIA_API_KEY!,
      sepolia: process.env.SEPOLIA_API_KEY!,
    },
  },
};

export default config;
