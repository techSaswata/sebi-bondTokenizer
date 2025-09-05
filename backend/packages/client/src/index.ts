import { Connection, PublicKey, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Import IDL types
const BondFactoryIDL = require('./bond_factory.json') as Idl;
const BondAMMIDL = require('./bond_amm.json') as Idl;

export class BondMarketClient {
  private connection: Connection;
  private provider: AnchorProvider;
  private bondFactoryProgram: Program;
  private bondAMMProgram: Program;

  constructor(
    connection: Connection,
    wallet: Keypair,
    opts: { commitment?: web3.Commitment; preflightCommitment?: web3.Commitment } = {}
  ) {
    this.connection = connection;
    
    const defaultOpts = {
      commitment: 'confirmed' as web3.Commitment,
      preflightCommitment: 'confirmed' as web3.Commitment,
      ...opts,
    };

    this.provider = new AnchorProvider(
      connection,
      { 
        publicKey: wallet.publicKey, 
        signTransaction: (tx) => Promise.resolve(tx),
        signAllTransactions: (txs) => Promise.resolve(txs)
      },
      defaultOpts
    );

    // Initialize programs with their respective program IDs
    this.bondFactoryProgram = new Program(
      BondFactoryIDL,
      this.provider
    );

    this.bondAMMProgram = new Program(
      BondAMMIDL,
      this.provider
    );
  }

  // Bond Factory methods
  async createMarket(
    marketParams: {
      issuerName: string;
      maturityTimestamp: BN;
      couponRateBps: number;
    },
    admin: Keypair
  ) {
    try {
      // Derive market PDA from issuerName
      const [marketPda, marketBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(marketParams.issuerName)],
        this.bondFactoryProgram.programId
      );

      // Derive marketAuthority PDA from marketPda
      const [marketAuthorityPda, marketAuthorityBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), marketPda.toBuffer()],
        this.bondFactoryProgram.programId
      );

      // Derive bondMint PDA from marketPda
      const [bondMintPda, bondMintBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("bond_mint"), marketPda.toBuffer()],
        this.bondFactoryProgram.programId
      );

      const tx = await this.bondFactoryProgram.methods
        .createMarket(
          marketParams.issuerName,
          marketParams.maturityTimestamp,
          marketParams.couponRateBps
        )
        .accounts({
          admin: admin.publicKey,
          market: marketPda,
          bondMint: bondMintPda,
          marketAuthority: marketAuthorityPda,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([admin])
        .rpc();

      return {
        success: true,
        transaction: tx,
        market: marketPda,
        bondMint: bondMintPda,
        marketAuthority: marketAuthorityPda,
      };
    } catch (error) {
      console.error('Error creating market:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getMarketInfo(market: PublicKey) {
    try {
      // Use the connection to get account info directly
      const accountInfo = await this.connection.getAccountInfo(market);
      if (!accountInfo) {
        return {
          success: false,
          error: 'Account not found',
        };
      }
      return {
        success: true,
        accountInfo,
      };
    } catch (error) {
      console.error('Error fetching market info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Bond AMM methods
  async initializeAmm(
    ammParams: {
      market: PublicKey;
      bondMint: PublicKey;
      quoteMint: PublicKey;
      issuerName: string;
    },
    admin: Keypair
  ) {
    try {
      const ammStateKeypair = Keypair.generate();

      // Derive factoryMarketPda using issuerName (must be passed in ammParams)
      if (!ammParams.issuerName) {
        throw new Error('issuerName is required in ammParams for correct PDA derivation');
      }
      const [factoryMarketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(ammParams.issuerName)],
        this.bondFactoryProgram.programId
      );

      const tx = await this.bondAMMProgram.methods
        .initializeAmm()
        .accounts({
          admin: admin.publicKey,
          ammState: ammStateKeypair.publicKey,
          market: factoryMarketPda, // Correct PDA, owned by bond_factory
          marketAuthority: ammParams.market, // This should be the market authority PDA
          bondMint: ammParams.bondMint,
          bondVault: ammParams.bondMint, // This should be the bond vault PDA
          quoteMint: ammParams.quoteMint,
          quoteVault: ammParams.quoteMint, // This should be the quote vault PDA
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([ammStateKeypair, admin])
        .rpc();

      return {
        success: true,
        transaction: tx,
        ammState: ammStateKeypair.publicKey,
      };
    } catch (error) {
      console.error('Error initializing AMM:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async swap(
    ammState: PublicKey,
    swapParams: {
      amountIn: BN;
      swapForBond: boolean;
    },
    user: Keypair,
    market: PublicKey,
    bondMint: PublicKey,
    quoteMint: PublicKey
  ) {
    try {
      const tx = await this.bondAMMProgram.methods
        .swap(
          swapParams.amountIn,
          swapParams.swapForBond
        )
        .accounts({
          user: user.publicKey,
          market,
          marketAuthority: market, // This should be the market authority PDA
          ammState,
          userBondAta: bondMint, // This should be the user's bond token account
          userQuoteAta: quoteMint, // This should be the user's quote token account
          bondVault: bondMint, // This should be the bond vault PDA
          quoteVault: quoteMint, // This should be the quote vault PDA
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      return {
        success: true,
        transaction: tx,
      };
    } catch (error) {
      console.error('Error performing swap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getAmmInfo(ammState: PublicKey) {
    try {
      // Use the connection to get account info directly
      const accountInfo = await this.connection.getAccountInfo(ammState);
      if (!accountInfo) {
        return {
          success: false,
          error: 'Account not found',
        };
      }
      return {
        success: true,
        accountInfo,
      };
    } catch (error) {
      console.error('Error fetching AMM info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Utility methods
  private async getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    return await web3.PublicKey.findProgramAddress(
      [
        owner.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    ).then(([address]) => address);
  }

  // Get connection and provider for external use
  getConnection(): Connection {
    return this.connection;
  }

  getProvider(): AnchorProvider {
    return this.provider;
  }

  getBondFactoryProgram(): Program {
    return this.bondFactoryProgram;
  }

  getBondAMMProgram(): Program {
    return this.bondAMMProgram;
  }
}

// Export types for external use

// Export utility functions
export const createBondMarketClient = (
  connection: Connection,
  wallet: Keypair,
  opts?: { commitment?: web3.Commitment; preflightCommitment?: web3.Commitment }
) => {
  return new BondMarketClient(connection, wallet, opts);
};
