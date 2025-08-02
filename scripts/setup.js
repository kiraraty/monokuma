const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 开始设置Battle Pets游戏...");

  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.getBalance()), "ETH");

  try {
    // 1. 编译合约
    console.log("\n📦 编译智能合约...");
    await hre.run("compile");
    console.log("✅ 合约编译完成");

    // 2. 部署合约
    console.log("\n🚀 部署智能合约...");
    await hre.run("deploy");
    console.log("✅ 合约部署完成");

    // 3. 验证合约（如果支持）
    console.log("\n🔍 验证智能合约...");
    try {
      await hre.run("verify:verify", {
        address: "CONTRACT_ADDRESS", // 需要替换为实际地址
        constructorArguments: [],
      });
      console.log("✅ 合约验证完成");
    } catch (error) {
      console.log("⚠️ 合约验证失败:", error.message);
    }

    console.log("\n🎉 Battle Pets游戏设置完成！");
    console.log("\n📋 下一步:");
    console.log("1. 更新 src/contexts/Web3Context.jsx 中的合约地址");
    console.log("2. 运行 npm run dev 启动前端");
    console.log("3. 连接MetaMask钱包开始游戏");

  } catch (error) {
    console.error("❌ 设置失败:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 