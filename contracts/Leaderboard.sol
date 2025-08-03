// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";

contract Leaderboard is Ownable {
    GameToken public gameToken;

    // 赛季信息
    struct Season {
        uint256 seasonId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPool;
        bool isActive;
        bool rewardsDistributed;
    }

    // 玩家积分
    struct PlayerScore {
        uint256 score;
        uint256 lastUpdateTime;
        uint256 seasonId;
    }

    // 当前赛季
    uint256 public currentSeasonId = 1;
    uint256 public seasonDuration = 7 days; // 7天一个赛季

    // 赛季映射
    mapping(uint256 => Season) public seasons;

    // 玩家积分映射 (seasonId => address => PlayerScore)
    mapping(uint256 => mapping(address => PlayerScore)) public playerScores;

    // 事件
    event SeasonStarted(
        uint256 indexed seasonId,
        uint256 startTime,
        uint256 endTime
    );
    event SeasonEnded(uint256 indexed seasonId, uint256 totalPool);
    event ScoreUpdated(address indexed player, uint256 seasonId, uint256 score);
    event RewardsDistributed(
        uint256 indexed seasonId,
        address[] winners,
        uint256[] amounts
    );

    constructor(address _gameToken) Ownable() {
        gameToken = GameToken(_gameToken);

        // 初始化第一个赛季
        _startNewSeason();
    }

    // 更新玩家积分
    function updateScore(address player, uint256 points) external {
        require(
            msg.sender == owner() || _isBattleContract(msg.sender),
            unicode"只有战斗合约可以调用"
        );
        require(seasons[currentSeasonId].isActive, unicode"赛季未开始");

        PlayerScore storage playerScore = playerScores[currentSeasonId][player];

        // 如果是新玩家或新赛季
        if (playerScore.seasonId != currentSeasonId) {
            playerScore.seasonId = currentSeasonId;
            playerScore.score = 0;
        }

        playerScore.score += points;
        playerScore.lastUpdateTime = block.timestamp;

        emit ScoreUpdated(player, currentSeasonId, playerScore.score);

        // 检查是否需要结束赛季
        if (block.timestamp >= seasons[currentSeasonId].endTime) {
            _endSeason();
        }
    }

    // 开始新赛季
    function _startNewSeason() internal {
        Season memory newSeason = Season({
            seasonId: currentSeasonId,
            startTime: block.timestamp,
            endTime: block.timestamp + seasonDuration,
            totalPool: 0,
            isActive: true,
            rewardsDistributed: false
        });

        seasons[currentSeasonId] = newSeason;

        emit SeasonStarted(
            currentSeasonId,
            newSeason.startTime,
            newSeason.endTime
        );
    }

    // 结束赛季
    function _endSeason() internal {
        require(seasons[currentSeasonId].isActive, unicode"赛季已结束");

        Season storage season = seasons[currentSeasonId];
        season.isActive = false;

        // 计算奖池总额
        season.totalPool = gameToken.balanceOf(address(this));

        emit SeasonEnded(currentSeasonId, season.totalPool);

        // 开始新赛季
        currentSeasonId++;
        _startNewSeason();
    }

    // 手动结束赛季（管理员）
    function endSeason() external onlyOwner {
        require(seasons[currentSeasonId].isActive, unicode"赛季已结束");
        _endSeason();
    }

    // 分配赛季奖励
    function distributeSeasonRewards(uint256 seasonId) external onlyOwner {
        require(seasonId < currentSeasonId, unicode"赛季不存在");
        require(!seasons[seasonId].rewardsDistributed, unicode"奖励已分配");
        require(seasons[seasonId].totalPool > 0, unicode"奖池为空");

        Season storage season = seasons[seasonId];
        season.rewardsDistributed = true;

        // 获取前10%的玩家
        address[] memory topPlayers = _getTopPlayers(seasonId, 10);

        if (topPlayers.length == 0) {
            return;
        }

        // 计算奖励分配
        uint256[] memory rewards = new uint256[](topPlayers.length);
        uint256 totalReward = season.totalPool;

        for (uint256 i = 0; i < topPlayers.length; i++) {
            // 根据排名分配奖励（第一名50%，第二名30%，第三名20%）
            if (i == 0) {
                rewards[i] = (totalReward * 50) / 100;
            } else if (i == 1) {
                rewards[i] = (totalReward * 30) / 100;
            } else if (i == 2) {
                rewards[i] = (totalReward * 20) / 100;
            } else {
                // 其余玩家平分剩余奖励
                uint256 remainingReward = totalReward -
                    rewards[0] -
                    rewards[1] -
                    rewards[2];
                rewards[i] = remainingReward / (topPlayers.length - 3);
            }

            // 发送奖励
            if (rewards[i] > 0) {
                gameToken.transfer(topPlayers[i], rewards[i]);
            }
        }

        emit RewardsDistributed(seasonId, topPlayers, rewards);
    }

    // 获取前N名玩家（简化版，实际应该用更高效的算法）
    function _getTopPlayers(
        uint256 seasonId,
        uint256 count
    ) internal view returns (address[] memory) {
        // 这里简化实现，实际应该维护一个排序列表
        // 或者使用链下排序，链上只存储结果
        address[] memory players = new address[](count);
        uint256 playerCount = 0;

        // 注意：这个实现是简化的，实际项目中应该使用更高效的方法
        // 比如维护一个排行榜映射或者使用链下排序

        return players;
    }

    // 获取玩家积分
    function getPlayerScore(
        address player,
        uint256 seasonId
    ) external view returns (PlayerScore memory) {
        return playerScores[seasonId][player];
    }

    // 获取当前赛季信息
    function getCurrentSeason() external view returns (Season memory) {
        return seasons[currentSeasonId];
    }

    // 设置赛季时长
    function setSeasonDuration(uint256 _duration) external onlyOwner {
        seasonDuration = _duration;
    }

    // 检查是否为战斗合约
    function _isBattleContract(address _contract) internal view returns (bool) {
        // 这里可以添加战斗合约地址的检查
        return false;
    }

    // 紧急提取代币
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = gameToken.balanceOf(address(this));
        if (balance > 0) {
            gameToken.transfer(owner(), balance);
        }
    }
}
