'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface CustomWalletMultiButtonProps {
  className?: string;
}

export const CustomWalletMultiButton: React.FC<CustomWalletMultiButtonProps> = ({ className }) => {
  const { wallet, connect, disconnect, connecting, connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClick = () => {
    if (!wallet) {
      setVisible(true);
    } else if (!connected) {
      connect();
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  const handleCopyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 400);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  const handleChangeWallet = () => {
    setVisible(true);
    setDropdownOpen(false);
  };

  let buttonText = 'Select Wallet';
  if (connecting) {
    buttonText = 'Connecting...';
  } else if (connected && publicKey) {
    buttonText = `${publicKey.toBase58().substring(0, 4)}...${publicKey.toBase58().substring(-4)}`;
  } else if (wallet) {
    buttonText = 'Connect';
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        disabled={connecting}
        className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}`}
      >
        {wallet && (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="w-5 h-5 mr-2"
          />
        )}
        {buttonText}
        {connected && (
          <svg
            className={`ml-2 w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {connected && dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            {publicKey && (
              <button
                onClick={handleCopyAddress}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            )}
            <button
              onClick={handleChangeWallet}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Change Wallet
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
