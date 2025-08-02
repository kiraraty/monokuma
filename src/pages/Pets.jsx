import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Heart, Zap, Star, Sword, Shield, Zap as Speed, Droplets } from 'lucide-react';

const Pets = () => {
  const { isConnected, account, contracts } = useWeb3();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // 获取用户宠物
  const fetchPets = async () => {
    if (!isConnected || !contracts.battlePetsNFT) return;
    
    try {
      setLoading(true);
      const balance = await contracts.battlePetsNFT.balanceOf(account);
      const petList = [];
      
      for (let i = 0; i < balance; i++) {
        const tokenId = await contracts.battlePetsNFT.tokenOfOwnerByIndex(account, i);
        const petData = await contracts.battlePetsNFT.getPet(tokenId);
        petList.push({
          tokenId: tokenId.toString(),
          ...petData
        });
      }
      
      setPets(petList);
    } catch (error) {
      console.error('获取宠物失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 铸造宠物
  const mintPet = async () => {
    if (!contracts.battlePetsNFT) return;
    
    try {
      setLoading(true);
      const tx = await contracts.battlePetsNFT.mintPet();
      await tx.wait();
      await fetchPets();
      alert('宠物铸造成功！');
    } catch (error) {
      console.error('铸造宠物失败:', error);
      alert('铸造宠物失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 训练宠物
  const trainPet = async (tokenId) => {
    if (!contracts.battlePetsNFT) return;
    
    try {
      setLoading(true);
      const tx = await contracts.battlePetsNFT.trainPet(tokenId);
      await tx.wait();
      await fetchPets();
      alert('宠物训练成功！');
    } catch (error) {
      console.error('训练宠物失败:', error);
      alert('训练宠物失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 升级宠物
  const upgradePet = async (tokenId) => {
    if (!contracts.battlePetsNFT) return;
    
    try {
      setLoading(true);
      const tx = await contracts.battlePetsNFT.upgradePet(tokenId);
      await tx.wait();
      await fetchPets();
      alert('宠物升级成功！');
    } catch (error) {
      console.error('升级宠物失败:', error);
      alert('升级宠物失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [isConnected, account, contracts]);

  const getRarityColor = (rarity) => {
    const colors = {
      1: 'text-gray-400', // 普通
      2: 'text-green-400', // 稀有
      3: 'text-blue-400', // 史诗
      4: 'text-purple-400', // 传说
      5: 'text-yellow-400', // 神话
    };
    return colors[rarity] || colors[1];
  };

  const getRarityName = (rarity) => {
    const names = {
      1: '普通',
      2: '稀有',
      3: '史诗',
      4: '传说',
      5: '神话',
    };
    return names[rarity] || names[1];
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-4">请先连接钱包</h2>
        <p className="text-gray-400">连接钱包后查看你的宠物</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">我的宠物</h1>
        <button
          onClick={mintPet}
          disabled={loading || pets.length >= 5}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '铸造中...' : '铸造宠物'}
        </button>
      </div>

      {/* Pet Count */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Heart className="w-8 h-8 text-pink-400" />
            <div>
              <div className="text-2xl font-bold">{pets.length}/5</div>
              <div className="text-gray-400">拥有宠物</div>
            </div>
          </div>
          {pets.length >= 5 && (
            <div className="text-yellow-400 text-sm">
              已达到最大宠物数量限制
            </div>
          )}
        </div>
      </div>

      {/* Pets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">还没有宠物</h2>
          <p className="text-gray-400 mb-6">铸造你的第一个宠物开始冒险吧！</p>
          <button onClick={mintPet} className="btn-primary">
            铸造宠物
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.tokenId} className="pet-card">
              {/* Pet Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">宠物 #{pet.tokenId}</h3>
                  <div className={`flex items-center space-x-1 ${getRarityColor(pet.rarity)}`}>
                    <Star className="w-4 h-4" />
                    <span className="text-sm">{getRarityName(pet.rarity)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">等级</div>
                  <div className="text-lg font-bold text-blue-400">{pet.level}</div>
                </div>
              </div>

              {/* Pet Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sword className="w-4 h-4 text-red-400" />
                    <span className="text-sm">攻击力</span>
                  </div>
                  <span className="font-bold">{pet.attack}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">防御力</span>
                  </div>
                  <span className="font-bold">{pet.defense}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Speed className="w-4 h-4 text-green-400" />
                    <span className="text-sm">速度</span>
                  </div>
                  <span className="font-bold">{pet.speed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-pink-400" />
                    <span className="text-sm">生命值</span>
                  </div>
                  <span className="font-bold">{pet.hp}</span>
                </div>
              </div>

              {/* Skills */}
              {pet.skills.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-bold mb-2">技能</div>
                  <div className="flex flex-wrap gap-2">
                    {pet.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded"
                      >
                        技能 {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => trainPet(pet.tokenId)}
                  disabled={loading}
                  className="flex-1 btn-secondary text-sm disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  训练
                </button>
                <button
                  onClick={() => upgradePet(pet.tokenId)}
                  disabled={loading || pet.level >= 100}
                  className="flex-1 btn-primary text-sm disabled:opacity-50"
                >
                  <Star className="w-4 h-4 mr-1" />
                  升级
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pets; 