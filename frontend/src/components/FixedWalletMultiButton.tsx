'use client';

import React, { useEffect } from 'react';
import { WalletMultiButton as BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface FixedWalletMultiButtonProps {
  className?: string;
}

export const FixedWalletMultiButton: React.FC<FixedWalletMultiButtonProps> = ({ className }) => {
  useEffect(() => {
    // Use a more targeted approach to fix the dropdown clicks
    const fixWalletDropdowns = () => {
      setTimeout(() => {
        // Find wallet adapter elements and ensure they're clickable
        const walletElements = document.querySelectorAll('[class*="wallet-adapter"]');
        
        walletElements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          
          // Remove any pointer-events: none that might be blocking clicks
          if (htmlElement.style.pointerEvents === 'none') {
            htmlElement.style.pointerEvents = 'auto';
          }
          
          // Ensure proper z-index for dropdown elements
          if (htmlElement.classList.contains('wallet-adapter-dropdown-list')) {
            htmlElement.style.zIndex = '9999';
            htmlElement.style.position = 'absolute';
          }
          
          if (htmlElement.classList.contains('wallet-adapter-dropdown-list-item')) {
            htmlElement.style.cursor = 'pointer';
            htmlElement.style.pointerEvents = 'auto';
          }
        });
      }, 100);
    };

    // Fix on mount
    fixWalletDropdowns();

    // Fix when wallet state changes
    const interval = setInterval(fixWalletDropdowns, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      <BaseWalletMultiButton 
        className={className}
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
};
