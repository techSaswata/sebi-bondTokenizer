'use client';

import React, { useState, useEffect } from 'react';
import { useBondMarket } from '@/providers/BondMarketProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

interface PortfolioItem {
  marketId: string;
  bondName: string;
  bondSymbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  couponRate: number;
  maturityDate: string;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export default function PortfolioPage() {
  const { connected, publicKey } = useBondMarket();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPnLPercent, setTotalPnLPercent] = useState(0);

  useEffect(() => {
    if (connected && publicKey) {
      loadPortfolio();
    } else {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      // This would typically fetch from your API or blockchain
      // For now, we'll show some mock data
      const mockPortfolio: PortfolioItem[] = [
        {
          marketId: 'market-1',
          bondName: 'Ambuja Cements Bond 2024',
          bondSymbol: 'AMBJB24',
          quantity: 10,
          avgBuyPrice: 98000,
          currentPrice: 99500,
          couponRate: 8.5,
          maturityDate: '2024-12-31',
          totalValue: 995000,
          unrealizedPnL: 15000,
          unrealizedPnLPercent: 1.53,
        },
        {
          marketId: 'market-2',
          bondName: 'HDFC Bank Bond 2025',
          bondSymbol: 'HDFCB25',
          quantity: 5,
          avgBuyPrice: 101000,
          currentPrice: 99800,
          couponRate: 7.2,
          maturityDate: '2025-06-15',
          totalValue: 499000,
          unrealizedPnL: -6000,
          unrealizedPnLPercent: -1.19,
        },
      ];

      setPortfolio(mockPortfolio);
      
      const total = mockPortfolio.reduce((sum, item) => sum + item.totalValue, 0);
      const pnl = mockPortfolio.reduce((sum, item) => sum + item.unrealizedPnL, 0);
      const pnlPercent = total > 0 ? (pnl / (total - pnl)) * 100 : 0;
      
      setTotalValue(total);
      setTotalPnL(pnl);
      setTotalPnLPercent(pnlPercent);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const days = Math.ceil((new Date(maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
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
              <Link href="/markets" className="text-gray-300 hover:text-white transition-colors">
                Markets
              </Link>
              <Link href="/portfolio" className="text-cyan-400 font-medium">
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
          <h1 className="text-4xl font-bold text-white mb-4">Portfolio</h1>
          <p className="text-gray-400 text-lg">
            Track your bond investments and performance
          </p>
        </div>

        {/* Connection Status */}
        {!connected ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
            <h3 className="text-yellow-400 font-semibold mb-2">Wallet Connection Required</h3>
            <p className="text-yellow-400/80 mb-4">
              Connect your wallet to view your bond portfolio
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-yellow-500 !to-yellow-600" />
          </div>
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Total Portfolio Value</div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(totalValue)}
                </div>
                <div className="text-sm text-gray-400">
                  {portfolio.length} bond{portfolio.length !== 1 ? 's' : ''} held
                </div>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Unrealized P&L</div>
                <div className={`text-3xl font-bold mb-1 ${
                  totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </div>
                <div className={`text-sm ${
                  totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                </div>
              </div>
              
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Average Yield</div>
                <div className="text-3xl font-bold text-cyan-400 mb-1">
                  {portfolio.length > 0 
                    ? (portfolio.reduce((sum, item) => sum + item.couponRate, 0) / portfolio.length).toFixed(2)
                    : '0.00'
                  }%
                </div>
                <div className="text-sm text-gray-400">
                  Weighted by holdings
                </div>
              </div>
            </div>

            {/* Portfolio Holdings */}
            {isLoading ? (
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-48"></div>
                        <div className="h-3 bg-gray-700 rounded w-32"></div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-4 bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : portfolio.length > 0 ? (
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white">Your Holdings</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Bond
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Avg Price
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Total Value
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          P&L
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Maturity
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {portfolio.map((item) => (
                        <tr key={item.marketId} className="hover:bg-gray-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white font-medium">{item.bondName}</div>
                              <div className="text-gray-400 text-sm">{item.bondSymbol} • {item.couponRate}%</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            {formatCurrency(item.avgBuyPrice)}
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            {formatCurrency(item.currentPrice)}
                          </td>
                          <td className="px-6 py-4 text-right text-white font-semibold">
                            {formatCurrency(item.totalValue)}
                          </td>
                          <td className={`px-6 py-4 text-right font-semibold ${
                            item.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <div>{item.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(item.unrealizedPnL)}</div>
                            <div className="text-sm">
                              ({item.unrealizedPnLPercent >= 0 ? '+' : ''}{item.unrealizedPnLPercent.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            <div>{formatDate(item.maturityDate)}</div>
                            <div className="text-gray-400 text-sm">
                              {getDaysToMaturity(item.maturityDate)} days
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/markets/${item.marketId}`}
                              className="inline-flex items-center px-3 py-1 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
                            >
                              Trade
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">No bonds in portfolio</h3>
                <p className="text-gray-400 mb-6">
                  Start building your bond portfolio by exploring available markets
                </p>
                <Link
                  href="/markets"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
                >
                  Explore Markets
                </Link>
              </div>
            )}

            {/* Performance Chart Placeholder */}
            {portfolio.length > 0 && (
              <div className="mt-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Portfolio Performance</h3>
                <div className="h-64 bg-gray-700/30 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Performance chart coming soon</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
