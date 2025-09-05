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
  getUserBalances: (marketId: string) => Promise<{ bondBalance: number; usdcBalance: number } | null>;
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
  const BOND_AMM_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_BOND_AMM_PROGRAM_ID || '2PgJbyjvWCGmUipMokJ148ymXta2hU6yNeyg5oEPUEjD');

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

      // Create a unique identifier for this market to avoid PDA collisions
      // The issuer_name is used as a seed for PDA generation, so it must be under 32 bytes
      const timestamp = Date.now();
      const shortIssuerName = `${params.bondSymbol.substring(0, 8)}_${timestamp}`;
      
      // Ensure the issuer name is under 32 bytes (Solana PDA seed limit)
      if (Buffer.from(shortIssuerName).length > 31) { // 31 to be safe
        throw new Error('Issuer name too long for PDA generation. Please use a shorter bond symbol.');
      }

      // Derive PDAs using the short issuer name
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(shortIssuerName)],
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
        .createMarket(shortIssuerName, maturityTimestamp, couponRateBps)
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
        bondMint: bondMintPda.toString(),
      });

      console.log('API Response:', apiResponse.data);

      if (!apiResponse.data.marketId) {
        throw new Error('Market created on blockchain but failed to save to database');
      }

      return {
        success: true,
        signature: tx,
        marketId: apiResponse.data.marketId,
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
    console.log('🚀 Starting AMM initialization for marketId:', marketId);
    
    if (!publicKey || !wallet) {
      console.log('❌ Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      console.log('📡 Getting provider...');
      const provider = getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }
      console.log('✅ Provider obtained');

      console.log('🔧 Creating AMM program instance...');
      const program = new Program(bondAmmIdl as Idl, provider);
      console.log('✅ AMM program created');
      
      // Get market details from API
      console.log('📊 Fetching market details from API...');
      const marketResponse = await axios.get(`${API_BASE_URL}/api/markets/${marketId}`);
      const market = marketResponse.data.data;
      console.log('📊 Market data:', {
        marketId: market.marketId,
        bondSymbol: market.bondSymbol,
        createdAt: market.createdAt,
        marketAccount: market.marketAccount,
        bondMint: market.bondMint
      });

      // Use the market account address that was stored during market creation
      // This is more reliable than trying to re-derive the issuer name
      if (!market.marketAccount) {
        throw new Error('Market account address not found. Please create the market first.');
      }
      
      const factoryMarketPda = new PublicKey(market.marketAccount);
      console.log('🏭 Factory Market PDA (from database):', factoryMarketPda.toString());
      
      const [bondMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond_mint"), factoryMarketPda.toBuffer()],
        BOND_FACTORY_PROGRAM_ID
      );
      console.log('🪙 Bond Mint PDA:', bondMintPda.toString());
      
      const quoteMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
      console.log('💵 Quote Mint (USDC):', quoteMint.toString());

      // Derive PDAs for AMM using the Factory's market account
      const [ammStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("amm"), factoryMarketPda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );
      console.log('🔄 AMM State PDA:', ammStatePda.toString());
      
      const [marketAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), factoryMarketPda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );
      console.log('👑 Market Authority PDA:', marketAuthorityPda.toString());

      // Check if accounts exist before trying to initialize
      console.log('🔍 Checking account existence...');
      try {
        const marketAccountInfo = await connection.getAccountInfo(factoryMarketPda);
        console.log('📋 Market account exists:', !!marketAccountInfo);
        if (marketAccountInfo) {
          console.log('📋 Market account owner:', marketAccountInfo.owner.toString());
          console.log('📋 Market account data length:', marketAccountInfo.data.length);
          console.log('📋 Market account lamports:', marketAccountInfo.lamports);
          console.log('📋 Market account executable:', marketAccountInfo.executable);
        } else {
          console.log('❌ Market account does not exist! This is the problem.');
          console.log('🔍 Expected market PDA:', factoryMarketPda.toString());
          console.log('🔍 Factory program ID:', BOND_FACTORY_PROGRAM_ID.toString());
          
          // Let's also check if there are any accounts with similar addresses
          console.log('🔍 Checking for similar accounts...');
          const accounts = await connection.getProgramAccounts(BOND_FACTORY_PROGRAM_ID);
          console.log('📊 Total accounts owned by factory program:', accounts.length);
          accounts.forEach((account, index) => {
            if (index < 5) { // Show first 5 accounts
              console.log(`📊 Account ${index}:`, account.pubkey.toString());
            }
          });
        }
      } catch (error) {
        console.log('❌ Error checking market account:', error);
      }

      try {
        const bondMintInfo = await connection.getAccountInfo(bondMintPda);
        console.log('🪙 Bond mint exists:', !!bondMintInfo);
        if (bondMintInfo) {
          console.log('🪙 Bond mint owner:', bondMintInfo.owner.toString());
        }
      } catch (error) {
        console.log('❌ Error checking bond mint:', error);
      }

      try {
        const ammStateInfo = await connection.getAccountInfo(ammStatePda);
        console.log('🔄 AMM state exists:', !!ammStateInfo);
        if (ammStateInfo) {
          console.log('🔄 AMM state owner:', ammStateInfo.owner.toString());
        }
      } catch (error) {
        console.log('❌ Error checking AMM state:', error);
      }

      console.log('📝 Preparing transaction accounts...');
      
      const accounts = {
        admin: publicKey,
        ammState: ammStatePda,
        market: factoryMarketPda,
        marketAuthority: marketAuthorityPda,
        bondMint: bondMintPda,
        quoteMint: quoteMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      };
      console.log('📝 Accounts prepared:', Object.keys(accounts).reduce((acc, key) => {
        acc[key] = accounts[key as keyof typeof accounts].toString();
        return acc;
      }, {} as Record<string, string>));

      console.log('🚀 Sending initializeAmm transaction...');
      const tx = await program.methods
        .initializeAmm()
        .accounts(accounts)
        .rpc();

      console.log('✅ AMM initialization successful! Transaction:', tx);
      return {
        success: true,
        signature: tx,
      };
    } catch (error) {
      console.error('❌ Error initializing AMM:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  }, [publicKey, wallet, getProvider, connection, API_BASE_URL, BOND_AMM_PROGRAM_ID, BOND_FACTORY_PROGRAM_ID]);

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
      
      // Get market details from API to get blockchain addresses
      const marketResponse = await axios.get(`${API_BASE_URL}/api/markets/${params.marketId}`);
      const market = marketResponse.data.data;
      
      // Validate required fields
      if (!market.marketAccount) {
        throw new Error('Market account not found. Please create the market on-chain first.');
      }
      
      if (!market.bondMint) {
        throw new Error('Bond mint not found. Please create the bond mint first.');
      }

      // Validate that the addresses are valid base58 public keys
      let bondMintPda: PublicKey;
      try {
        bondMintPda = new PublicKey(market.bondMint);
      } catch (error) {
        throw new Error('Invalid bond mint address format. Please create a proper market first.');
      }
      const quoteMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC devnet

      // Use Factory's market account (AMM operates on existing Factory market)
      const factoryMarketPda = new PublicKey(market.marketAccount);

      // Derive PDAs for AMM using the Factory's market account
      const [ammStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("amm"), factoryMarketPda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );

      const [marketAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), factoryMarketPda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );

      // Derive vault PDAs
      const [bondVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond_vault"), ammStatePda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );

      const [quoteVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("quote_vault"), ammStatePda.toBuffer()],
        BOND_AMM_PROGRAM_ID
      );

      // Get or create user ATAs
      const { getOrCreateAssociatedTokenAccount } = await import('@solana/spl-token');
      
      const userBondAta = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.adapter as any,
        bondMintPda,
        publicKey
      );

      const userQuoteAta = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.adapter as any,
        quoteMint,
        publicKey
      );

      // Convert amount to lamports/tokens (assuming 6 decimals for both USDC and bonds)
      const amountIn = new BN(params.amountIn * 1_000_000);

      const tx = await program.methods
        .swap(amountIn, params.swapForBond)
        .accounts({
          user: publicKey,
          market: factoryMarketPda, // Use Factory's existing market account
          marketAuthority: marketAuthorityPda,
          userBondAta: userBondAta.address,
          userQuoteAta: userQuoteAta.address,
          bondVault: bondVaultPda,
          quoteVault: quoteVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { 
        success: true, 
        signature: tx
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
  }, [publicKey, wallet, getProvider, connection, API_BASE_URL, BOND_AMM_PROGRAM_ID, BOND_FACTORY_PROGRAM_ID]);

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

  const getUserBalances = useCallback(async (marketId: string): Promise<{ bondBalance: number; usdcBalance: number } | null> => {
    if (!publicKey) return null;

    try {
      const marketResponse = await axios.get(`${API_BASE_URL}/api/markets/${marketId}`);
      const market = marketResponse.data.data;
      
      if (!market.bondMint) return null;

      // Validate that bondMint is a valid base58 public key
      let bondMintPda: PublicKey;
      try {
        bondMintPda = new PublicKey(market.bondMint);
      } catch (error) {
        console.warn('Invalid bondMint format:', market.bondMint);
        return { bondBalance: 0, usdcBalance: 0 };
      }

      const quoteMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC devnet

      // Get user ATAs
      const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
      
      const userBondAta = await getAssociatedTokenAddress(bondMintPda, publicKey);
      const userQuoteAta = await getAssociatedTokenAddress(quoteMint, publicKey);

      let bondBalance = 0;
      let usdcBalance = 0;

      try {
        const bondAccount = await getAccount(connection, userBondAta);
        bondBalance = Number(bondAccount.amount) / 1_000_000; // Assuming 6 decimals
      } catch (error) {
        // Account doesn't exist yet, balance is 0
      }

      try {
        const usdcAccount = await getAccount(connection, userQuoteAta);
        usdcBalance = Number(usdcAccount.amount) / 1_000_000; // USDC has 6 decimals
      } catch (error) {
        // Account doesn't exist yet, balance is 0
      }

      return { bondBalance, usdcBalance };
    } catch (error) {
      console.error('Error fetching user balances:', error);
      return null;
    }
  }, [publicKey, connection, API_BASE_URL]);

  const value: BondMarketContextType = {
    createMarket,
    swapTokens,
    getMarkets,
    getMarketDetails,
    getUserBalances,
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
