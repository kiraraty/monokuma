require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

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
      chainId: process.env.MONAD_CHAIN_ID,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  paths: {
    artifacts: "./src/artifacts"
  }
}; 