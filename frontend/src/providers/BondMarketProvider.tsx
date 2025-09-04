'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';

// Import IDL
import bondFactoryIdl from '@/idl/bond_factory.json';
import bondAmmIdl from '@/idl/bond_amm.json';

interface BondMarketContextType {
  createMarket: (params: CreateMarketParams) => Promise<CreateMarketResult>;
  swapTokens: (params: SwapParams) => Promise<SwapResult>;
  getMarkets: () => Promise<Market[]>;
  getMarketDetails: (marketId: string) => Promise<Market | null>;
  connected: boolean;
  publicKey: PublicKey | null;
  loading: boolean;
  initializeAMM: (marketId: string) => Promise<InitializeAMMResult>;
}

interface CreateMarketParams {
  issuerName: string;
  bondName: string;
  bondSymbol: string;
  totalSupply: number;
  maturityDate: string;
  couponRate: number;
  faceValue: number;
  currentPrice: number;
}

interface CreateMarketResult {
  success: boolean;
  signature?: string;
  marketId?: string;
  error?: string;
}

interface SwapParams {
  marketId: string;
  amountIn: number;
  swapForBond: boolean;
}

interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
}

interface InitializeAMMResult {
  success: boolean;
  signature?: string;
  error?: string;
}

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
  solanaTransactionHash?: string;
  marketAccount?: string;
}

const BondMarketContext = createContext<BondMarketContextType | null>(null);

export const useBondMarket = () => {
  const context = useContext(BondMarketContext);
  if (!context) {
    throw new Error('useBondMarket must be used within a BondMarketProvider');
  }
  return context;
};

interface BondMarketProviderProps {
  children: React.ReactNode;
}

export const BondMarketProvider: React.FC<BondMarketProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const BOND_FACTORY_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_BOND_FACTORY_PROGRAM_ID || 'EhxFepaeryGJh1S2g4JmQGcaXMtSK5akEF9fjwst2Qjb');
  const BOND_AMM_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_BOND_AMM_PROGRAM_ID || '3YwVMmAgU9dCQaTSQb71FdqUrsrUvD6vGwbQAnBFvaBE');

  const getProvider = useCallback(() => {
    if (!wallet || !publicKey) return null;
    
    return new AnchorProvider(
      connection,
      wallet.adapter as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet, publicKey]);

  const createMarket = useCallback(async (params: CreateMarketParams): Promise<CreateMarketResult> => {
    if (!publicKey || !wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      const program = new Program(bondFactoryIdl as Idl, provider);
      
      const maturityTimestamp = new BN(Math.floor(new Date(params.maturityDate).getTime() / 1000));
      const couponRateBps = Math.floor(params.couponRate * 100); // Convert to basis points

      // Derive PDAs
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(params.issuerName)],
        BOND_FACTORY_PROGRAM_ID
      );
      
      const [marketAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), marketPda.toBuffer()],
        BOND_FACTORY_PROGRAM_ID
      );
      
      const [bondMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond_mint"), marketPda.toBuffer()],
        BOND_FACTORY_PROGRAM_ID
      );

      // Mock quote mint (USDC on devnet)
      const quoteMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC devnet

      // Create transaction
      const tx = await program.methods
        .createMarket(params.issuerName, maturityTimestamp, couponRateBps)
        .accounts({
          admin: publicKey,
          market: marketPda,
          marketAuthority: marketAuthorityPda,
          bondMint: bondMintPda,
          quoteMint: quoteMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Save to database via API
      const apiResponse = await axios.post(`${API_BASE_URL}/api/markets`, {
        issuer: publicKey.toString(),
        bondName: params.bondName,
        bondSymbol: params.bondSymbol,
        totalSupply: params.totalSupply,
        maturityDate: params.maturityDate,
        couponRate: params.couponRate,
        faceValue: params.faceValue,
        currentPrice: params.currentPrice,
        solanaTransactionHash: tx,
        marketAccount: marketPda.toString(),
      });

      return {
        success: true,
        signature: tx,
        marketId: apiResponse.data.data.marketId,
      };
    } catch (error) {
      console.error('Error creating market:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  }, [publicKey, wallet, getProvider, API_BASE_URL, BOND_FACTORY_PROGRAM_ID]);

  const initializeAMM = useCallback(async (marketId: string): Promise<InitializeAMMResult> => {
    if (!publicKey || !wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      const program = new Program(bondAmmIdl as Idl, provider);
      
      // Get market details from API
      const marketResponse = await axios.get(`${API_BASE_URL}/api/markets/${marketId}`);
      const market = marketResponse.data.data;
      
      const marketPda = new PublicKey(market.marketAccount);
      const bondMintPda = new PublicKey(market.bondMint || ""); // You'll need to store this
      const quoteMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC devnet

      // Derive PDAs for AMM
      const [ammStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("amm"), marketPda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );

      const [marketAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), marketPda.toBuffer()],
        BOND_FACTORY_PROGRAM_ID
      );

      const tx = await program.methods
        .initializeAmm()
        .accounts({
          admin: publicKey,
          ammState: ammStatePda,
          market: marketPda,
          marketAuthority: marketAuthorityPda,
          bondMint: bondMintPda,
          quoteMint: quoteMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
      };
    } catch (error) {
      console.error('Error initializing AMM:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  }, [publicKey, wallet, getProvider, API_BASE_URL, BOND_AMM_PROGRAM_ID]);

  const swapTokens = useCallback(async (params: SwapParams): Promise<SwapResult> => {
    if (!publicKey || !wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      const program = new Program(bondAmmIdl as Idl, provider);
      
      // Implementation for swap
      // This requires getting market details, user token accounts, etc.
      console.log('Swapping tokens:', params);
      
      // For now, return success - you'll need to implement the full swap logic
      return { 
        success: true, 
        signature: 'mock_swap_signature'
      };
    } catch (error) {
      console.error('Error swapping tokens:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  }, [publicKey, wallet, getProvider, BOND_AMM_PROGRAM_ID]);

  const getMarkets = useCallback(async (): Promise<Market[]> => {
    try {
      console.log('🌐 Fetching markets from:', `${API_BASE_URL}/api/markets`);
      const response = await axios.get(`${API_BASE_URL}/api/markets`);
      console.log('✅ Markets API response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error fetching markets:', error);
      return [];
    }
  }, [API_BASE_URL]);

  const getMarketDetails = useCallback(async (marketId: string): Promise<Market | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/markets/${marketId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching market details:', error);
      return null;
    }
  }, [API_BASE_URL]);

  const value: BondMarketContextType = {
    createMarket,
    swapTokens,
    getMarkets,
    getMarketDetails,
    connected,
    publicKey,
    loading,
    initializeAMM,
  };

  return (
    <BondMarketContext.Provider value={value}>
      {children}
    </BondMarketContext.Provider>
  );
};
