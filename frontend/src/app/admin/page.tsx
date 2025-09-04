'use client';

import React, { useState, useEffect } from 'react';
import { useBondMarket } from '@/providers/BondMarketProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { dummyBonds } from '@/data/dummyBonds';

interface CreateMarketForm {
  issuerName: string;
  bondName: string;
  bondSymbol: string;
  totalSupply: number;
  maturityDate: string;
  couponRate: number;
  faceValue: number;
  currentPrice: number;
}

export default function AdminPage() {
  const { createMarket, initializeAMM, connected, loading, publicKey } = useBondMarket();
  
  const [formData, setFormData] = useState<CreateMarketForm>({
    issuerName: '',
    bondName: '',
    bondSymbol: '',
    totalSupply: 1000000,
    maturityDate: '',
    couponRate: 8.5,
    faceValue: 100000,
    currentPrice: 98000,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(null);
  const [showBondSelector, setShowBondSelector] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMarket(formData);
      
      if (result.success) {
        alert(`Market created successfully! Market ID: ${result.marketId}`);
        
        // Ask if user wants to initialize AMM
        const initAMM = window.confirm('Market created! Do you want to initialize the AMM for trading?');
        if (initAMM && result.marketId) {
          const ammResult = await initializeAMM(result.marketId);
          if (ammResult.success) {
            alert('AMM initialized successfully! Trading is now enabled.');
          } else {
            alert(`AMM initialization failed: ${ammResult.error}`);
          }
        }
        
        // Reset form
        setFormData({
          issuerName: '',
          bondName: '',
          bondSymbol: '',
          totalSupply: 1000000,
          maturityDate: '',
          couponRate: 8.5,
          faceValue: 100000,
          currentPrice: 98000,
        });
      } else {
        alert(`Failed to create market: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating market:', error);
      alert('Failed to create market');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillFromDummyBond = (index: number) => {
    const bond = dummyBonds[index];
    if (!bond) return;

    setFormData({
      issuerName: bond.name,
      bondName: `${bond.name} Bond`,
      bondSymbol: bond.isin || `${bond.name.substring(0, 4).toUpperCase()}B`,
      totalSupply: 1000000,
      maturityDate: bond.maturity_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      couponRate: bond.coupon_rate || 8.5,
      faceValue: 100000,
      currentPrice: typeof bond.min_investment === 'number' ? bond.min_investment : 98000,
    });
    
    setSelectedBondIndex(index);
    setShowBondSelector(false);
  };

  const calculateYield = () => {
    if (formData.currentPrice && formData.faceValue && formData.couponRate) {
      return ((formData.faceValue - formData.currentPrice) / formData.currentPrice * 100 + formData.couponRate).toFixed(2);
    }
    return '0.00';
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
              <Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link href="/admin" className="text-cyan-400 font-medium">
                Admin
              </Link>
            </nav>
            
            <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-blue-600 hover:!from-cyan-600 hover:!to-blue-700" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Admin Panel</h1>
          <p className="text-gray-400 text-lg">
            Create new bond markets and manage existing ones
          </p>
        </div>

        {/* Connection Status */}
        {!connected ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-yellow-400 font-semibold mb-2">Wallet Connection Required</h3>
            <p className="text-yellow-400/80 mb-4">
              Connect your wallet to create bond markets. Only authorized administrators can create markets.
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-yellow-500 !to-yellow-600" />
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-400">
                Connected as: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </span>
            </div>
          </div>
        )}

        {/* Bond Selector */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Quick Fill from Database</h2>
            <button
              onClick={() => setShowBondSelector(!showBondSelector)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showBondSelector ? 'Hide' : 'Show'} Bond List
            </button>
          </div>
          
          {showBondSelector && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {dummyBonds.slice(0, 10).map((bond, index) => (
                <div
                  key={bond.id}
                  onClick={() => fillFromDummyBond(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBondIndex === index
                      ? 'bg-purple-600/20 border border-purple-500'
                      : 'bg-gray-700/30 hover:bg-gray-600/30 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium">{bond.name}</h4>
                      <p className="text-gray-400 text-sm">{bond.isin} • {bond.coupon_rate}% • {bond.maturity_date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-400 font-semibold">{bond.coupon_rate}%</div>
                      <div className="text-gray-400 text-sm">Coupon</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Market Form */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Create New Bond Market</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Issuer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Issuer Name *
                </label>
                <input
                  type="text"
                  name="issuerName"
                  value={formData.issuerName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Ambuja Cements"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Bond Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bond Name *
                </label>
                <input
                  type="text"
                  name="bondName"
                  value={formData.bondName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Ambuja Cements Bond 2024"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Bond Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bond Symbol *
                </label>
                <input
                  type="text"
                  name="bondSymbol"
                  value={formData.bondSymbol}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., AMBJB24"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Total Supply */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Supply (bonds) *
                </label>
                <input
                  type="number"
                  name="totalSupply"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Maturity Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maturity Date *
                </label>
                <input
                  type="date"
                  name="maturityDate"
                  value={formData.maturityDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Coupon Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coupon Rate (% p.a.) *
                </label>
                <input
                  type="number"
                  name="couponRate"
                  value={formData.couponRate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="50"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Face Value */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Face Value (₹) *
                </label>
                <input
                  type="number"
                  name="faceValue"
                  value={formData.faceValue}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Price (₹) *
                </label>
                <input
                  type="number"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Calculated Metrics */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Calculated Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Estimated Yield</div>
                  <div className="text-cyan-400 font-semibold text-lg">{calculateYield()}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Discount</div>
                  <div className="text-white font-semibold text-lg">
                    {formData.faceValue && formData.currentPrice ? 
                      (((formData.faceValue - formData.currentPrice) / formData.faceValue) * 100).toFixed(2) : '0.00'
                    }%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Total Market Value</div>
                  <div className="text-white font-semibold text-lg">
                    ₹{(formData.currentPrice * formData.totalSupply).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!connected || isSubmitting || loading}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isSubmitting ? 'Creating Market...' : 'Create Bond Market'}
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-blue-400 font-semibold mb-3">Instructions</h3>
          <ul className="text-blue-400/80 space-y-2 text-sm">
            <li>• Ensure your wallet is connected before creating a market</li>
            <li>• Market creation requires Solana transaction fees (small amount)</li>
            <li>• After creating a market, you can initialize AMM for trading</li>
            <li>• All fields marked with * are required</li>
            <li>• Use the "Quick Fill" feature to populate from existing bond data</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
