import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StakeInfo = () => {
  const [activeTab, setActiveTab] = useState('bonus');

  const tabs = [
    { id: 'bonus', label: 'Welcome Bonus', icon: '💰' },
    { id: 'vip', label: 'VIP System', icon: '👑' },
    { id: 'features', label: 'Features', icon: '⭐' }
  ];

  const content = {
    bonus: {
      title: 'Massive Welcome Package',
      items: [
        { icon: '💎', title: '5G Stake Cash', desc: 'Instant bonus just for registering with RIPCITYTICKETS' },
        { icon: '🪙', title: '260,000 Gold Coins', desc: 'Huge virtual currency package to get started' },
        { icon: '💸', title: '5% Rakeback', desc: 'Continuous rewards on all your gameplay' },
        { icon: '🔗', title: 'Referral Rewards', desc: 'Keep earning when you refer friends' }
      ]
    },
    vip: {
      title: 'Exclusive VIP Benefits',
      items: [
        { icon: '🚀', title: 'Faster Withdrawals', desc: 'Priority processing for VIP members' },
        { icon: '💸', title: 'Cashback Rewards', desc: 'Weekly cashback on all losses' },
        { icon: '🎪', title: 'Exclusive Tournaments', desc: 'VIP-only events with bigger prizes' },
        { icon: '🎯', title: 'Personal Account Manager', desc: 'Dedicated support for high rollers' }
      ]
    },
    features: {
      title: 'Why Choose Stake.us',
      items: [
        { icon: '🔒', title: 'Fully Licensed', desc: 'Regulated and licensed in multiple states' },
        { icon: '📱', title: 'Mobile Optimized', desc: 'Play anywhere on any device' },
        { icon: '💳', title: 'Crypto Friendly', desc: 'Bitcoin, Ethereum, and more accepted' },
        { icon: '🎮', title: '1000+ Games', desc: 'Slots, table games, live dealers, and more' }
      ]
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-transparent to-black/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Stake.us is the Best Choice
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Join millions of players who trust Stake.us for their online gaming experience
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-1 border border-white/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <h3 className="text-3xl font-bold text-white text-center mb-8">
              {content[activeTab].title}
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {content[activeTab].items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="text-4xl mb-4 text-center">{item.icon}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-blue-200">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-xl p-8 border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Experience the Best?
          </h3>
          <p className="text-blue-200 mb-6">
            Join thousands of satisfied players and claim your welcome bonus today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://stake.us/?c=RIPCITYTICKETS"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Claim Your 5G + 260K Gold Bonus
            </a>
            
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-1">Don't forget our code:</p>
              <code className="bg-black/50 text-green-400 px-4 py-2 rounded-lg font-mono font-bold border border-green-500/30">
                RIPCITYTICKETS
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StakeInfo;
