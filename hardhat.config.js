require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
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
      url: "https://testnet-rpc.monad.xyz", // 替换为 Monad 官方 RPC
      chainId: 10143, // Monad 测试网 Chain ID (示例)
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  paths: {
    artifacts: "./src/artifacts"
  }
}; 