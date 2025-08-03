// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    // 最大供应量
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18; // 100万代币

    // 初始分配
    uint256 public constant INITIAL_SUPPLY = 100000 * 10 ** 18; // 10万代币

    // 每日挖矿奖励
    uint256 public dailyMiningReward = 1000 * 10 ** 18; // 1000代币/天

    // 用户每日挖矿记录
    mapping(address => uint256) public lastMiningTime;

    // 事件
    event TokensMined(address indexed user, uint256 amount);
    event DailyRewardUpdated(uint256 newAmount);

    constructor() ERC20("Battle Pets Token", "BPT") Ownable() {
        // 初始铸造给合约部署者
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // 每日挖矿
    function mineDaily() external {
        require(
            block.timestamp >= lastMiningTime[msg.sender] + 1 days,
            unicode"需要等待24小时"
        );
        require(
            totalSupply() + dailyMiningReward <= MAX_SUPPLY,
            unicode"超过最大供应量"
        );

        lastMiningTime[msg.sender] = block.timestamp;
        _mint(msg.sender, dailyMiningReward);

        emit TokensMined(msg.sender, dailyMiningReward);
    }

    // 战斗奖励
    function battleReward(address winner, uint256 amount) external {
        require(
            msg.sender == owner() || _isBattleContract(msg.sender),
            unicode"只有战斗合约可以调用"
        );
        require(totalSupply() + amount <= MAX_SUPPLY, unicode"超过最大供应量");

        _mint(winner, amount);
    }

    // 销毁代币
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // 设置每日挖矿奖励
    function setDailyMiningReward(uint256 _amount) external onlyOwner {
        dailyMiningReward = _amount;
        emit DailyRewardUpdated(_amount);
    }

    // 战斗合约地址映射
    mapping(address => bool) public battleContracts;

    // 设置战斗合约
    function setBattleContract(address _contract) external onlyOwner {
        battleContracts[_contract] = true;
    }

    // 移除战斗合约
    function removeBattleContract(address _contract) external onlyOwner {
        battleContracts[_contract] = false;
    }

    // 检查是否为战斗合约
    function _isBattleContract(address _contract) internal view returns (bool) {
        return battleContracts[_contract];
    }

    // 重写transfer函数，添加一些限制
    function transfer(
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(to != address(0), unicode"不能转账到零地址");
        return super.transfer(to, amount);
    }

    // 重写transferFrom函数
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(to != address(0), unicode"不能转账到零地址");
        return super.transferFrom(from, to, amount);
    }
}
