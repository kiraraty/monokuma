// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./GameToken.sol";

contract BattlePetsNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    // 宠物属性结构
    struct Pet {
        uint16 attack; // 攻击力
        uint16 defense; // 防御力
        uint16 speed; // 速度
        uint16 hp; // 生命值
        uint8 level; // 等级
        uint8 rarity; // 稀有度 (1-5)
        uint8[] skills; // 技能ID数组
        uint256 lastTrainingTime; // 上次训练时间
        uint256 lastBattleTime; // 上次战斗时间
    }

    // 稀有度概率 (百分比)
    uint8[5] public rarityChances = [50, 30, 15, 4, 1]; // 普通、稀有、史诗、传说、神话

    // 映射：tokenId => 宠物属性
    mapping(uint256 => Pet) public pets;

    // 映射：用户地址 => 拥有的宠物数量
    mapping(address => uint256) public userPetCount;

    // 游戏代币合约
    GameToken public gameToken;

    // 训练费用
    uint256 public trainingCost = 10 * 10 ** 18; // 10个代币
    uint256 public upgradeCost = 50 * 10 ** 18; // 50个代币

    // 事件
    event PetMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint8 rarity
    );
    event PetTrained(
        uint256 indexed tokenId,
        uint16 attack,
        uint16 defense,
        uint16 speed,
        uint16 hp
    );
    event PetUpgraded(uint256 indexed tokenId, uint8 newLevel, uint8 newSkill);

    constructor(address _gameToken) ERC721("Battle Pets", "BPETS") Ownable() {
        gameToken = GameToken(_gameToken);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // 铸造宠物（免费）
    function mintPet() external returns (uint256) {
        require(userPetCount[msg.sender] < 5, unicode"最多只能拥有5只宠物");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // 生成随机属性
        uint8 rarity = _generateRarity();
        Pet memory newPet = _generatePetAttributes(rarity);

        pets[newTokenId] = newPet;
        userPetCount[msg.sender]++;

        _mint(msg.sender, newTokenId);

        emit PetMinted(msg.sender, newTokenId, rarity);
        return newTokenId;
    }

    // 训练宠物
    function trainPet(uint256 tokenId) external {
        require(_exists(tokenId), unicode"宠物不存在");
        require(ownerOf(tokenId) == msg.sender, unicode"不是宠物主人");
        require(
            block.timestamp >= pets[tokenId].lastTrainingTime + 1 hours,
            unicode"训练冷却中"
        );

        // 检查代币余额
        require(
            gameToken.balanceOf(msg.sender) >= trainingCost,
            unicode"代币不足"
        );

        // 扣除代币
        gameToken.transferFrom(msg.sender, address(this), trainingCost);

        // 提升属性
        Pet storage pet = pets[tokenId];
        pet.attack += uint16(_random(1, 5));
        pet.defense += uint16(_random(1, 5));
        pet.speed += uint16(_random(1, 3));
        pet.hp += uint16(_random(5, 15));
        pet.lastTrainingTime = block.timestamp;

        emit PetTrained(tokenId, pet.attack, pet.defense, pet.speed, pet.hp);
    }

    // 升级宠物
    function upgradePet(uint256 tokenId) external {
        require(_exists(tokenId), unicode"宠物不存在");
        require(ownerOf(tokenId) == msg.sender, unicode"不是宠物主人");

        Pet storage pet = pets[tokenId];
        require(pet.level < 100, unicode"已达到最高等级");

        // 检查代币余额
        require(
            gameToken.balanceOf(msg.sender) >= upgradeCost,
            unicode"代币不足"
        );

        // 扣除代币
        gameToken.transferFrom(msg.sender, address(this), upgradeCost);

        // 升级
        pet.level++;

        // 随机获得新技能
        if (_random(1, 100) <= 30) {
            // 30%概率获得新技能
            uint8 newSkill = uint8(_random(1, 20));
            pet.skills.push(newSkill);
        }

        emit PetUpgraded(
            tokenId,
            pet.level,
            pet.skills.length > 0 ? pet.skills[pet.skills.length - 1] : 0
        );
    }

    // 获取宠物属性
    function getPet(uint256 tokenId) external view returns (Pet memory) {
        require(_exists(tokenId), unicode"宠物不存在");
        return pets[tokenId];
    }

    // 生成稀有度
    function _generateRarity() internal view returns (uint8) {
        uint256 rand = _random(1, 100);
        uint256 cumulative = 0;

        for (uint8 i = 0; i < 5; i++) {
            cumulative += rarityChances[i];
            if (rand <= cumulative) {
                return i + 1;
            }
        }
        return 1; // 默认普通
    }

    // 生成宠物属性
    function _generatePetAttributes(
        uint8 rarity
    ) internal view returns (Pet memory) {
        uint16 baseMultiplier = uint16(rarity);

        return
            Pet({
                attack: uint16(_random(10, 20) * baseMultiplier),
                defense: uint16(_random(8, 15) * baseMultiplier),
                speed: uint16(_random(5, 12) * baseMultiplier),
                hp: uint16(_random(50, 100) * baseMultiplier),
                level: 1,
                rarity: rarity,
                skills: new uint8[](0),
                lastTrainingTime: 0,
                lastBattleTime: 0
            });
    }

    // 简单随机数生成（生产环境建议使用Chainlink VRF）
    function _random(uint256 min, uint256 max) internal view returns (uint256) {
        return
            (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender
                    )
                )
            ) % (max - min + 1)) + min;
    }

    // 设置训练费用
    function setTrainingCost(uint256 _cost) external onlyOwner {
        trainingCost = _cost;
    }

    // 设置升级费用
    function setUpgradeCost(uint256 _cost) external onlyOwner {
        upgradeCost = _cost;
    }

    // 重写必要的函数
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
