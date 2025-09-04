'use client';

import React, { useState, useEffect } from 'react';
import { useBondMarket } from '@/providers/BondMarketProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

interface Market {
  marketId: string;
  issuer: string;
  bondName: string;
  bondSymbol: string;
  totalSupply: number;
  maturityDate: string;
  couponRate: number;
  faceValue: number;
  currentPrice: number;
  totalBondsIssued: number;
  bondsSold: number;
  status: 'active' | 'matured' | 'paused';
  createdAt: string;
}

export default function MarketsPage() {
  const { getMarkets, connected, loading } = useBondMarket();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'yield' | 'maturity' | 'rating'>('yield');

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    console.log('🔄 Loading markets...');
    setIsLoading(true);
    try {
      const marketData = await getMarkets();
      console.log('📊 Markets data received:', marketData);
      setMarkets(marketData);
    } catch (error) {
      console.error('❌ Error loading markets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMarkets = markets.filter(market =>
    market.bondName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'yield':
        return b.couponRate - a.couponRate;
      case 'maturity':
        return new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime();
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateYield = (couponRate: number, currentPrice: number, faceValue: number) => {
    return ((faceValue - currentPrice) / currentPrice * 100 + couponRate).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">₹</span>
              </div>
              <span className="text-white text-xl font-semibold">BondBazaar</span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/markets" className="text-cyan-400 font-medium">
                Markets
              </Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                Admin
              </Link>
            </nav>
            
            <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-blue-600 hover:!from-cyan-600 hover:!to-blue-700" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Bond Markets</h1>
          <p className="text-gray-400 text-lg">
            Discover and trade corporate bonds with instant settlement on Solana blockchain
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search bonds by name or issuer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="yield">Sort by Yield</option>
                <option value="maturity">Sort by Maturity</option>
                <option value="rating">Sort by Rating</option>
              </select>
              
              <button
                onClick={loadMarkets}
                disabled={isLoading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <p className="text-yellow-400 text-center">
              Connect your wallet to start trading bonds
            </p>
          </div>
        )}

        {/* Markets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMarkets.map((market) => (
              <div
                key={market.marketId}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                      {market.bondName}
                    </h3>
                    <p className="text-gray-400 text-sm">{market.bondSymbol}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    market.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {market.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coupon Rate</span>
                    <span className="text-white font-semibold">{market.couponRate}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Yield</span>
                    <span className="text-cyan-400 font-semibold">
                      {calculateYield(market.couponRate, market.currentPrice, market.faceValue)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maturity</span>
                    <span className="text-white">{formatDate(market.maturityDate)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white">₹{market.currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Face Value</span>
                    <span className="text-white">₹{market.faceValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Bonds Sold: {market.bondsSold}/{market.totalSupply}
                    </div>
                    <Link 
                      href={`/markets/${market.marketId}`}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                    >
                      Trade
                    </Link>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(market.bondsSold / market.totalSupply) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'No bond markets available at the moment'}
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
            >
              Create First Market
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
