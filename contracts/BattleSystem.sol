// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BattlePetsNFT.sol";
import "./GameToken.sol";

contract BattleSystem is Ownable {
    BattlePetsNFT public petsNFT;
    GameToken public gameToken;

    // 战斗费用
    uint256 public battleFee = 5 * 10 ** 18; // 5个代币

    // 战斗奖励
    uint256 public winnerReward = 10 * 10 ** 18; // 10个代币
    uint256 public loserReward = 2 * 10 ** 18; // 2个代币

    // 战斗状态
    enum BattleStatus {
        Pending,
        InProgress,
        Finished
    }

    struct Battle {
        uint256 battleId;
        address player1;
        uint256 pet1Id;
        address player2;
        uint256 pet2Id;
        BattleStatus status;
        address winner;
        uint256 startTime;
        uint256 endTime;
        uint256 rounds;
    }

    // 战斗记录
    mapping(uint256 => Battle) public battles;
    uint256 public battleCount;

    // 等待匹配的玩家
    struct MatchmakingEntry {
        address player;
        uint256 petId;
        uint256 entryTime;
        uint256 entryFee;
    }

    MatchmakingEntry[] public matchmakingQueue;

    // 事件
    event BattleStarted(
        uint256 indexed battleId,
        address player1,
        address player2,
        uint256 pet1Id,
        uint256 pet2Id
    );
    event BattleFinished(
        uint256 indexed battleId,
        address winner,
        uint256 rounds
    );
    event PlayerQueued(address indexed player, uint256 petId, uint256 entryFee);

    constructor(address _petsNFT, address _gameToken) Ownable() {
        petsNFT = BattlePetsNFT(_petsNFT);
        gameToken = GameToken(_gameToken);
    }

    // 进入匹配队列
    function enterMatchmaking(uint256 petId) external {
        require(petsNFT.ownerOf(petId) == msg.sender, unicode"不是宠物主人");
        require(
            gameToken.balanceOf(msg.sender) >= battleFee,
            unicode"代币不足"
        );

        // 扣除入场费
        gameToken.transferFrom(msg.sender, address(this), battleFee);

        // 添加到匹配队列
        matchmakingQueue.push(
            MatchmakingEntry({
                player: msg.sender,
                petId: petId,
                entryTime: block.timestamp,
                entryFee: battleFee
            })
        );

        emit PlayerQueued(msg.sender, petId, battleFee);

        // 尝试匹配
        _tryMatchmaking();
    }

    // 尝试匹配玩家
    function _tryMatchmaking() internal {
        if (matchmakingQueue.length >= 2) {
            // 简单的FIFO匹配
            MatchmakingEntry memory player1 = matchmakingQueue[0];
            MatchmakingEntry memory player2 = matchmakingQueue[1];

            // 移除前两个玩家
            _removeFromQueue(0);
            _removeFromQueue(0);

            // 开始战斗
            _startBattle(
                player1.player,
                player1.petId,
                player2.player,
                player2.petId
            );
        }
    }

    // 从队列中移除玩家
    function _removeFromQueue(uint256 index) internal {
        require(index < matchmakingQueue.length, unicode"索引超出范围");

        for (uint256 i = index; i < matchmakingQueue.length - 1; i++) {
            matchmakingQueue[i] = matchmakingQueue[i + 1];
        }
        matchmakingQueue.pop();
    }

    // 开始战斗
    function _startBattle(
        address player1,
        uint256 pet1Id,
        address player2,
        uint256 pet2Id
    ) internal {
        battleCount++;

        Battle memory newBattle = Battle({
            battleId: battleCount,
            player1: player1,
            pet1Id: pet1Id,
            player2: player2,
            pet2Id: pet2Id,
            status: BattleStatus.InProgress,
            winner: address(0),
            startTime: block.timestamp,
            endTime: 0,
            rounds: 0
        });

        battles[battleCount] = newBattle;

        emit BattleStarted(battleCount, player1, player2, pet1Id, pet2Id);

        // 执行战斗逻辑
        _executeBattle(battleCount);
    }

    // 执行战斗
    function _executeBattle(uint256 battleId) internal {
        Battle storage battle = battles[battleId];
        BattlePetsNFT.Pet memory pet1 = petsNFT.getPet(battle.pet1Id);
        BattlePetsNFT.Pet memory pet2 = petsNFT.getPet(battle.pet2Id);

        uint16 hp1 = pet1.hp;
        uint16 hp2 = pet2.hp;
        uint256 round = 0;

        // 回合制战斗
        while (hp1 > 0 && hp2 > 0 && round < 20) {
            // 最多20回合
            round++;

            // 宠物1攻击
            if (hp1 > 0) {
                uint256 damage1 = _calculateDamage(pet1.attack, pet2.defense);
                if (damage1 > hp2) {
                    hp2 = 0;
                } else {
                    hp2 -= uint16(damage1);
                }
            }

            // 宠物2攻击
            if (hp2 > 0) {
                uint256 damage2 = _calculateDamage(pet2.attack, pet1.defense);
                if (damage2 > hp1) {
                    hp1 = 0;
                } else {
                    hp1 -= uint16(damage2);
                }
            }
        }

        // 确定胜负
        address winner;
        if (hp1 > 0) {
            winner = battle.player1;
        } else if (hp2 > 0) {
            winner = battle.player2;
        } else {
            // 平局，随机选择获胜者
            winner = _random() % 2 == 0 ? battle.player1 : battle.player2;
        }

        // 更新战斗结果
        battle.winner = winner;
        battle.status = BattleStatus.Finished;
        battle.endTime = block.timestamp;
        battle.rounds = round;

        // 分配奖励
        _distributeRewards(battle);

        emit BattleFinished(battleId, winner, round);
    }

    // 计算伤害
    function _calculateDamage(
        uint16 attack,
        uint16 defense
    ) internal view returns (uint256) {
        uint256 baseDamage = uint256(attack);
        uint256 defenseReduction = (uint256(defense) * 50) / 100; // 防御减少50%伤害

        uint256 finalDamage = baseDamage - defenseReduction;

        // 添加随机因素
        uint256 randomFactor = (_random() % 20) + 90; // 90-110%的随机伤害
        finalDamage = (finalDamage * randomFactor) / 100;

        return finalDamage > 0 ? finalDamage : 1; // 最小伤害为1
    }

    // 分配奖励
    function _distributeRewards(Battle storage battle) internal {
        address winner = battle.winner;
        address loser = winner == battle.player1
            ? battle.player2
            : battle.player1;

        // 给获胜者奖励
        gameToken.battleReward(winner, winnerReward);

        // 给失败者安慰奖
        gameToken.battleReward(loser, loserReward);
    }

    // 简单随机数生成
    function _random() internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender
                    )
                )
            );
    }

    // 获取匹配队列长度
    function getMatchmakingQueueLength() external view returns (uint256) {
        return matchmakingQueue.length;
    }

    // 获取战斗信息
    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }

    // 设置战斗费用
    function setBattleFee(uint256 _fee) external onlyOwner {
        battleFee = _fee;
    }

    // 设置奖励
    function setRewards(
        uint256 _winnerReward,
        uint256 _loserReward
    ) external onlyOwner {
        winnerReward = _winnerReward;
        loserReward = _loserReward;
    }
}
