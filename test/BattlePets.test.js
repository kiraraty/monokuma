const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BattlePetsNFT", function () {
  let BattlePetsNFT, GameToken;
  let battlePetsNFT, gameToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署游戏代币合约
    GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();

    // 部署宠物NFT合约
    BattlePetsNFT = await ethers.getContractFactory("BattlePetsNFT");
    battlePetsNFT = await BattlePetsNFT.deploy(gameToken.address);

    // 给用户一些代币用于测试
    await gameToken.transfer(user1.address, ethers.parseEther("1000"));
    await gameToken.transfer(user2.address, ethers.parseEther("1000"));
  });

  describe("铸造宠物", function () {
    it("应该能够铸造宠物", async function () {
      await battlePetsNFT.connect(user1).mintPet();
      
      expect(await battlePetsNFT.balanceOf(user1.address)).to.equal(1);
      expect(await battlePetsNFT.userPetCount(user1.address)).to.equal(1);
    });

    it("应该限制最多5只宠物", async function () {
      // 铸造5只宠物
      for (let i = 0; i < 5; i++) {
        await battlePetsNFT.connect(user1).mintPet();
      }
      
      expect(await battlePetsNFT.balanceOf(user1.address)).to.equal(5);
      
      // 尝试铸造第6只宠物应该失败
      await expect(
        battlePetsNFT.connect(user1).mintPet()
      ).to.be.revertedWith("最多只能拥有5只宠物");
    });

    it("应该生成正确的宠物属性", async function () {
      await battlePetsNFT.connect(user1).mintPet();
      
      const pet = await battlePetsNFT.getPet(1);
      
      expect(pet.attack).to.be.gt(0);
      expect(pet.defense).to.be.gt(0);
      expect(pet.speed).to.be.gt(0);
      expect(pet.hp).to.be.gt(0);
      expect(pet.level).to.equal(1);
      expect(pet.rarity).to.be.gte(1).and.lte(5);
    });
  });

  describe("训练宠物", function () {
    beforeEach(async function () {
      await battlePetsNFT.connect(user1).mintPet();
      await gameToken.connect(user1).approve(battlePetsNFT.address, ethers.parseEther("1000"));
    });

    it("应该能够训练宠物", async function () {
      const petBefore = await battlePetsNFT.getPet(1);
      
      await battlePetsNFT.connect(user1).trainPet(1);
      
      const petAfter = await battlePetsNFT.getPet(1);
      
      expect(petAfter.attack).to.be.gte(petBefore.attack);
      expect(petAfter.defense).to.be.gte(petBefore.defense);
      expect(petAfter.speed).to.be.gte(petBefore.speed);
      expect(petAfter.hp).to.be.gte(petBefore.hp);
    });

    it("应该扣除训练费用", async function () {
      const balanceBefore = await gameToken.balanceOf(user1.address);
      
      await battlePetsNFT.connect(user1).trainPet(1);
      
      const balanceAfter = await gameToken.balanceOf(user1.address);
      const trainingCost = await battlePetsNFT.trainingCost();
      
      expect(balanceBefore - balanceAfter).to.equal(trainingCost);
    });

    it("非宠物主人不能训练", async function () {
      await expect(
        battlePetsNFT.connect(user2).trainPet(1)
      ).to.be.revertedWith("不是宠物主人");
    });
  });

  describe("升级宠物", function () {
    beforeEach(async function () {
      await battlePetsNFT.connect(user1).mintPet();
      await gameToken.connect(user1).approve(battlePetsNFT.address, ethers.parseEther("1000"));
    });

    it("应该能够升级宠物", async function () {
      const petBefore = await battlePetsNFT.getPet(1);
      
      await battlePetsNFT.connect(user1).upgradePet(1);
      
      const petAfter = await battlePetsNFT.getPet(1);
      
      expect(petAfter.level).to.equal(petBefore.level + 1);
    });

    it("应该扣除升级费用", async function () {
      const balanceBefore = await gameToken.balanceOf(user1.address);
      
      await battlePetsNFT.connect(user1).upgradePet(1);
      
      const balanceAfter = await gameToken.balanceOf(user1.address);
      const upgradeCost = await battlePetsNFT.upgradeCost();
      
      expect(balanceBefore - balanceAfter).to.equal(upgradeCost);
    });

    it("非宠物主人不能升级", async function () {
      await expect(
        battlePetsNFT.connect(user2).upgradePet(1)
      ).to.be.revertedWith("不是宠物主人");
    });
  });

  describe("权限控制", function () {
    it("只有管理员能设置费用", async function () {
      await expect(
        battlePetsNFT.connect(user1).setTrainingCost(ethers.parseEther("20"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(
        battlePetsNFT.connect(user1).setUpgradeCost(ethers.parseEther("100"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("管理员能够设置费用", async function () {
      await battlePetsNFT.setTrainingCost(ethers.parseEther("20"));
      await battlePetsNFT.setUpgradeCost(ethers.parseEther("100"));
      
      expect(await battlePetsNFT.trainingCost()).to.equal(ethers.parseEther("20"));
      expect(await battlePetsNFT.upgradeCost()).to.equal(ethers.parseEther("100"));
    });
  });
}); 