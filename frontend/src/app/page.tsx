"use client";

import LightRays from "@/components/LightRays";
import Link from "next/link";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import NoSSR from '@/components/NoSSR';
import { useState } from 'react';

export default function BondBazaarLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background Light Rays */}
      <div className="absolute inset-0 w-full h-full">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="absolute inset-0"
        />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">₹</span>
              </div>
              <span className="text-white text-xl font-semibold">BondBazaar</span>
            </Link>
            
            <div className="hidden md:flex space-x-8">
              <Link href="/markets" className="text-gray-300 hover:text-white transition-colors duration-200">
                Markets
              </Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors duration-200">
                Portfolio
              </Link>
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors duration-200">
                Admin
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <NoSSR>
                <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-blue-600 hover:!from-cyan-600 hover:!to-blue-700" />
              </NoSSR>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/markets"
                  className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Markets
                </Link>
                <Link
                  href="/portfolio"
                  className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Portfolio
                </Link>
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 pt-16 text-center">

        {/* New Platform Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-gradient-to-r from-green-400 to-blue-600 rounded-sm flex items-center justify-center">
                <div className="w-2 h-1 bg-white/70 rounded-sm"></div>
              </div>
              <span className="text-gray-300 text-sm font-medium">Decentralized Bond Trading</span>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            Trade bonds with
            <br />
            <span className="text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text">complete transparency</span>
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/markets" className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-full hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
            Start Trading
          </Link>
          <Link href="/markets" className="px-8 py-4 bg-transparent border border-gray-600 text-white font-semibold rounded-full hover:border-gray-400 hover:bg-gray-800/20 transition-all duration-200 backdrop-blur-sm">
            Explore Markets
          </Link>
        </div>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg mt-8 max-w-2xl mx-auto leading-relaxed">
          India's first decentralized bond marketplace on Solana blockchain. 
          Create, trade, and invest in corporate bonds with automated market makers and complete on-chain transparency.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Instant Settlements</h3>
            <p className="text-gray-400 text-sm">Trade bonds with instant settlement on Solana blockchain. No waiting periods, no intermediaries.</p>
          </div>
          
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-white font-bold text-xl">🏦</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">AMM Liquidity</h3>
            <p className="text-gray-400 text-sm">Automated market makers ensure continuous liquidity for all bond markets with fair pricing.</p>
          </div>
          
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Real-time Analytics</h3>
            <p className="text-gray-400 text-sm">Track yields, volumes, and market performance with comprehensive analytics and historical data.</p>
          </div>
        </div>
      </div>

      {/* Additional ambient light effects */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-400/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-radial from-blue-500/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
