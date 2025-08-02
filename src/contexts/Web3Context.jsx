import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import GameTokenArtifact from "../artifacts/contracts/GameToken.sol/GameToken.json";
import BattlePetsNFTArtifact from "../artifacts/contracts/BattlePetsNFT.sol/BattlePetsNFT.json";
import BattleSystemArtifact from "../artifacts/contracts/BattleSystem.sol/BattleSystem.json";
import MarketplaceArtifact from "../artifacts/contracts/Marketplace.sol/Marketplace.json";
import LeaderboardArtifact from "../artifacts/contracts/Leaderboard.sol/Leaderboard.json";

// 合约地址（部署后需要更新）
const CONTRACT_ADDRESSES = {
  gameToken: '0x2fF4713e0D5247cb0239F27ac5e99247Fa882745', // 部署后填入
  battlePetsNFT: '0xd9AD82CAF4ca01DF800d8a37903d60Fe82B90f63', // 部署后填入
  battleSystem: '0x67F954458d42D5A8ccaa1b72461FFe2c4B15ec38', // 部署后填入
  marketplace: '0x087aAA2d28e98730b287da79316B52809A0bAa74', // 部署后填入
  leaderboard: '0x50Db39Db8e53C64a7514bb401FC20d0858Dc4968', // 部署后填入
};
const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 连接钱包
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (typeof window.ethereum !== 'undefined') {
        // 请求连接钱包
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // 初始化合约
        await initializeContracts(signer);
        
        // 监听账户变化
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        console.log('钱包连接成功:', accounts[0]);
      } else {
        alert('请安装MetaMask钱包');
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      alert('连接钱包失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理账户变化
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // 用户断开连接
      disconnectWallet();
    } else {
      // 用户切换账户
      setAccount(accounts[0]);
      const signer = await provider.getSigner();
      setSigner(signer);
      await initializeContracts(signer);
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContracts({});
    setIsConnected(false);
    
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };

  // 初始化合约
  const initializeContracts = async (signer) => {
    try {
      const gameToken = new ethers.Contract(
        CONTRACT_ADDRESSES.gameToken,
        GameTokenArtifact.abi,
        signer
      );
  
      const battlePetsNFT = new ethers.Contract(
        CONTRACT_ADDRESSES.battlePetsNFT,
        BattlePetsNFTArtifact.abi,
        signer
      );
  
      const battleSystem = new ethers.Contract(
        CONTRACT_ADDRESSES.battleSystem,
        BattleSystemArtifact.abi,
        signer
      );
  
      const marketplace = new ethers.Contract(
        CONTRACT_ADDRESSES.marketplace,
        MarketplaceArtifact.abi,
        signer
      );
  
      const leaderboard = new ethers.Contract(
        CONTRACT_ADDRESSES.leaderboard,
        LeaderboardArtifact.abi,
        signer
      );
  
      setContracts({
        gameToken,
        battlePetsNFT,
        battleSystem,
        marketplace,
        leaderboard,
      });
    } catch (error) {
      console.error("初始化合约失败:", error);
    }
  };

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0]);
          setIsConnected(true);
          
          await initializeContracts(signer);
          
          window.ethereum.on('accountsChanged', handleAccountsChanged);
        }
      }
    };
    
    checkConnection();
  }, []);

  const value = {
    provider,
    signer,
    account,
    contracts,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}; 