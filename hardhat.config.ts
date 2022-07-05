import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';

dotenv.config();

const envAccounts: string[] = process.env.PRIVATE_KEY?.trim().split('\n') || [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ethereum: {
      // Ethereum mainnet
      url: process.env.NETWORK_URL_ETHEREUM || 'TBD',
    },
    polygon: {
      // Polygon mainnet
      url: process.env.NETWORK_URL_POLYGON || 'TBD',
    },
    goerli: {
      // Goerli Ethereum Testnet
      url: process.env.NETWORK_URL_GOERLI || 'TBD',
      accounts: envAccounts,
      gasPrice: 50000000000,
    },
    mumbai: {
      // Mumbai Polygon testnet
      url: process.env.NETWORK_URL_MUMBAI || 'TBD',
      accounts: envAccounts,
      gasPrice: 50000000000,
    },
  },
  // gasReporter: {
  //   enabled: /*process.env.REPORT_GAS !==*/ undefined,
  //   currency: 'USD',
  // },
  // npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS "arg1" "arg2"
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || 'TBD',
      polygon: process.env.POLYGONSCAN_API_KEY || 'TBD',
      goerli: process.env.ETHERSCAN_API_KEY || 'TBD',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || 'TBD',
    },
  },
};

export default config;
