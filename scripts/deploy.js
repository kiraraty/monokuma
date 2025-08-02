const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用账户部署:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");

  // 1. 部署游戏代币合约
  console.log("\n1. 部署游戏代币合约...");
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();
  console.log("游戏代币合约地址:", await gameToken.getAddress());

  // 2. 部署宠物NFT合约
  console.log("\n2. 部署宠物NFT合约...");
  const BattlePetsNFT = await ethers.getContractFactory("BattlePetsNFT");
  const battlePetsNFT = await BattlePetsNFT.deploy(await gameToken.getAddress());
  await battlePetsNFT.waitForDeployment();
  console.log("宠物NFT合约地址:", await battlePetsNFT.getAddress());

  // 3. 部署排行榜合约
  console.log("\n3. 部署排行榜合约...");
  const Leaderboard = await ethers.getContractFactory("Leaderboard");
  const leaderboard = await Leaderboard.deploy(await gameToken.getAddress());
  await leaderboard.waitForDeployment();
  console.log("排行榜合约地址:", await leaderboard.getAddress());

  // 4. 部署战斗系统合约
  console.log("\n4. 部署战斗系统合约...");
  const BattleSystem = await ethers.getContractFactory("BattleSystem");
  const battleSystem = await BattleSystem.deploy(
    await battlePetsNFT.getAddress(),
    await gameToken.getAddress()
  );
  await battleSystem.waitForDeployment();
  console.log("战斗系统合约地址:", await battleSystem.getAddress());

  // 5. 部署市场合约
  console.log("\n5. 部署市场合约...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    await battlePetsNFT.getAddress(),
    await gameToken.getAddress()
  );
  await marketplace.waitForDeployment();
  console.log("市场合约地址:", await marketplace.getAddress());

  // 6. 设置合约权限
  console.log("\n6. 设置合约权限...");
  await gameToken.setBattleContract(await battleSystem.getAddress());
  console.log("已授权战斗系统合约铸造代币");
  await gameToken.setBattleContract(await leaderboard.getAddress());
  console.log("已授权排行榜合约铸造代币");
  await battlePetsNFT.setApprovalForAll(await marketplace.getAddress(), true);
  console.log("已授权市场合约转移NFT");

  console.log("\n✅ 所有合约部署完成！");
  console.log("\n合约地址汇总:");
  console.log("游戏代币:", await gameToken.getAddress());
  console.log("宠物NFT:", await battlePetsNFT.getAddress());
  console.log("排行榜:", await leaderboard.getAddress());
  console.log("战斗系统:", await battleSystem.getAddress());
  console.log("市场:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});