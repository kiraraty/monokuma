import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { Sword, Heart, ShoppingCart, Trophy, Zap, Star, Users, Coins } from 'lucide-react';

const Home = () => {
  const { isConnected, account, contracts } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState('0');
  const [petCount, setPetCount] = useState(0);

  // 获取用户数据
  useEffect(() => {
    const fetchUserData = async () => {
      if (isConnected && contracts.gameToken && contracts.battlePetsNFT) {
        try {
          // 获取代币余额
          const balance = await contracts.gameToken.balanceOf(account);
          setTokenBalance(ethers.formatEther(balance));

          // 获取宠物数量
          const count = await contracts.battlePetsNFT.balanceOf(account);
          setPetCount(count.toString());
        } catch (error) {
          console.error('获取用户数据失败:', error);
        }
      }
    };

    fetchUserData();
  }, [isConnected, account, contracts]);

  const features = [
    {
      icon: Heart,
      title: '收集宠物',
      description: '铸造独特的NFT宠物，每个都有独特的属性和稀有度',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Sword,
      title: '实时对战',
      description: '与其他玩家进行链上回合制战斗，争夺排行榜位置',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: Zap,
      title: '训练升级',
      description: '通过训练和升级提升宠物属性，解锁新技能',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: ShoppingCart,
      title: '交易市场',
      description: '在NFT市场上买卖宠物，参与拍卖竞标',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Trophy,
      title: '赛季奖励',
      description: '参与赛季排行榜，瓜分丰厚奖池奖励',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Coins,
      title: '代币经济',
      description: '通过游戏获得代币，参与生态经济循环',
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  const stats = [
    { label: '总玩家数', value: '1,234', icon: Users },
    { label: '总宠物数', value: '5,678', icon: Heart },
    { label: '总交易量', value: '123,456', icon: ShoppingCart },
    { label: '奖池总额', value: '50,000', icon: Trophy },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Battle Pets
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            基于区块链的宠物对战游戏，收集、训练、对战你的NFT宠物，争夺排行榜荣耀！
          </p>
          
          {isConnected ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pets" className="btn-primary text-lg px-8 py-4">
                <Heart className="w-5 h-5 mr-2" />
                查看我的宠物
              </Link>
              <Link to="/battle" className="btn-secondary text-lg px-8 py-4">
                <Sword className="w-5 h-5 mr-2" />
                开始对战
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">连接钱包开始游戏</p>
              <Link to="/pets" className="btn-primary text-lg px-8 py-4">
                <Heart className="w-5 h-5 mr-2" />
                开始冒险
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* User Stats */}
      {isConnected && (
        <section className="card">
          <h2 className="text-2xl font-bold mb-6 text-center">我的数据</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Coins className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold text-yellow-400">{tokenBalance}</div>
              <div className="text-gray-400">游戏代币</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Heart className="w-8 h-8 mx-auto mb-2 text-pink-400" />
              <div className="text-2xl font-bold text-pink-400">{petCount}</div>
              <div className="text-gray-400">拥有宠物</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Star className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold text-purple-400">0</div>
              <div className="text-gray-400">战斗积分</div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">游戏特色</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="card text-center group hover:scale-105 transition-transform duration-300">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="card">
        <h2 className="text-3xl font-bold text-center mb-12">游戏数据</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <Icon className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card">
        <h2 className="text-3xl font-bold text-center mb-8">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/pets" className="pet-card text-center group">
            <Heart className="w-12 h-12 mx-auto mb-4 text-pink-400 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-lg font-bold mb-2">我的宠物</h3>
            <p className="text-gray-400 text-sm">查看和管理你的宠物</p>
          </Link>
          
          <Link to="/battle" className="pet-card text-center group">
            <Sword className="w-12 h-12 mx-auto mb-4 text-red-400 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-lg font-bold mb-2">开始对战</h3>
            <p className="text-gray-400 text-sm">与其他玩家战斗</p>
          </Link>
          
          <Link to="/marketplace" className="pet-card text-center group">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-green-400 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-lg font-bold mb-2">交易市场</h3>
            <p className="text-gray-400 text-sm">买卖宠物和道具</p>
          </Link>
          
          <Link to="/leaderboard" className="pet-card text-center group">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-lg font-bold mb-2">排行榜</h3>
            <p className="text-gray-400 text-sm">查看赛季排名</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 