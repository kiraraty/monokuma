require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// 部署者私钥
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    'monad-testnet': {
      url: process.env.MONAD_RPC_URL,
      chainId: process.env.MONAD_RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  },
  paths: {
    artifacts: "./src/artifacts"
  }
}; 