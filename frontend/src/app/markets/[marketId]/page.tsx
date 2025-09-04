'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getMarketDetails, swapTokens, connected, loading } = useBondMarket();
  
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapForBond, setSwapForBond] = useState(true);
  const [swapLoading, setSwapLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'details'>('trade');

  const marketId = params.marketId as string;

  useEffect(() => {
    if (marketId) {
      loadMarketDetails();
    }
  }, [marketId]);

  const loadMarketDetails = async () => {
    setIsLoading(true);
    try {
      const marketData = await getMarketDetails(marketId);
      if (marketData) {
        setMarket(marketData);
      } else {
        router.push('/markets');
      }
    } catch (error) {
      console.error('Error loading market details:', error);
      router.push('/markets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!market || !swapAmount || !connected) return;

    setSwapLoading(true);
    try {
      const result = await swapTokens({
        marketId: market.marketId,
        amountIn: parseFloat(swapAmount),
        swapForBond: swapForBond,
      });

      if (result.success) {
        alert(`Swap successful! Transaction: ${result.signature}`);
        setSwapAmount('');
        loadMarketDetails();
      } else {
        alert(`Swap failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Swap error:', error);
      alert('Swap failed');
    } finally {
      setSwapLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateYield = (couponRate: number, currentPrice: number, faceValue: number) => {
    return ((faceValue - currentPrice) / currentPrice * 100 + couponRate).toFixed(2);
  };

  const calculateMaturityDays = (maturityDate: string) => {
    const days = Math.ceil((new Date(maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const estimateSwapOutput = () => {
    if (!market || !swapAmount) return '0';
    const amount = parseFloat(swapAmount);
    
    if (swapForBond) {
      // Buying bonds with USDC - simple estimation
      return (amount / market.currentPrice).toFixed(4);
    } else {
      // Selling bonds for USDC
      return (amount * market.currentPrice * 0.995).toFixed(2); // 0.5% slippage
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading market details...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Market not found</h2>
          <Link href="/markets" className="text-cyan-400 hover:underline">
            Return to markets
          </Link>
        </div>
      </div>
    );
  }

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
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/markets" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Markets
                </Link>
              </li>
              <li>
                <span className="text-gray-600">/</span>
              </li>
              <li>
                <span className="text-white font-medium">{market.bondName}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Market Header */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white mb-2">{market.bondName}</h1>
              <p className="text-gray-400 text-lg">{market.bondSymbol}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  market.status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {market.status}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Issued by {market.issuer.slice(0, 8)}...{market.issuer.slice(-8)}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">
                {calculateYield(market.couponRate, market.currentPrice, market.faceValue)}%
              </div>
              <div className="text-gray-400">Current Yield</div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">₹{market.currentPrice.toLocaleString('en-IN')}</div>
            <div className="text-gray-400 text-sm">Current Price</div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">{market.couponRate}%</div>
            <div className="text-gray-400 text-sm">Coupon Rate</div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">{calculateMaturityDays(market.maturityDate)}</div>
            <div className="text-gray-400 text-sm">Days to Maturity</div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">{((market.bondsSold / market.totalSupply) * 100).toFixed(1)}%</div>
            <div className="text-gray-400 text-sm">Sold</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-800/40 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trade'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trade
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Details
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Panel */}
          {activeTab === 'trade' && (
            <div className="lg:col-span-2">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Trade Bonds</h3>
                
                {!connected ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Connect your wallet to start trading</p>
                    <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Trade Direction */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Trade Direction
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSwapForBond(true)}
                          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                            swapForBond
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Buy Bonds (USDC → Bonds)
                        </button>
                        <button
                          onClick={() => setSwapForBond(false)}
                          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                            !swapForBond
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Sell Bonds (Bonds → USDC)
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount ({swapForBond ? 'USDC' : 'Bonds'})
                      </label>
                      <input
                        type="number"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        placeholder={`Enter ${swapForBond ? 'USDC' : 'bond'} amount`}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Estimated Output */}
                    {swapAmount && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">You will receive approximately:</span>
                          <span className="text-white font-semibold">
                            {estimateSwapOutput()} {swapForBond ? 'Bonds' : 'USDC'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Trade Button */}
                    <button
                      onClick={handleSwap}
                      disabled={!swapAmount || swapLoading || loading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {swapLoading ? 'Processing...' : swapForBond ? 'Buy Bonds' : 'Sell Bonds'}
                    </button>

                    {/* Trading Fee Notice */}
                    <div className="text-xs text-gray-400 text-center">
                      Trading fee: 0.25% • Powered by Solana blockchain
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market Details */}
          {activeTab === 'details' && (
            <div className="lg:col-span-2">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Market Details</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Market ID</span>
                    <span className="text-white font-mono text-sm">{market.marketId}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Issuer</span>
                    <span className="text-white font-mono text-sm">{market.issuer}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Total Supply</span>
                    <span className="text-white">{market.totalSupply.toLocaleString('en-IN')} bonds</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Bonds Sold</span>
                    <span className="text-white">{market.bondsSold.toLocaleString('en-IN')} bonds</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Face Value</span>
                    <span className="text-white">₹{market.faceValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Maturity Date</span>
                    <span className="text-white">{formatDate(market.maturityDate)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white">{formatDate(market.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Chart Placeholder */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Price History</h3>
              <div className="h-48 bg-gray-700/30 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Chart coming soon</p>
              </div>
            </div>

            {/* Market Activity */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Market Activity</h3>
              <div className="space-y-3">
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
