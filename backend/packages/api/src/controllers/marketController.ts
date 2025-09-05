// packages/api/src/controllers/marketController.ts
import { Request, Response } from 'express';
import { Market, IMarket } from '../models/Market';
import { Connection, PublicKey } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';

interface CreateMarketRequest {
  issuer: string;
  bondName: string;
  bondSymbol: string;
  totalSupply: number;
  maturityDate: string;
  couponRate: number;
  faceValue: number;
  currentPrice: number;
  solanaTransactionHash?: string;
  marketAccount?: string;
  bondMint?: string;
}

export const createMarket = async (req: Request<{}, {}, CreateMarketRequest>, res: Response) => {
  try {
    const { 
      issuer, 
      bondName, 
      bondSymbol, 
      totalSupply, 
      maturityDate, 
      couponRate, 
      faceValue, 
      currentPrice,
      solanaTransactionHash,
      marketAccount,
      bondMint
    } = req.body;

    const market = new Market({
      marketId: uuidv4(),
      issuer,
      bondName,
      bondSymbol,
      totalSupply,
      maturityDate: new Date(maturityDate),
      couponRate,
      faceValue,
      currentPrice,
      solanaTransactionHash,
      marketAccount,
      bondMint
    });

    const savedMarket = await market.save();
    res.status(201).json(savedMarket);
  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({ error: 'Failed to create market' });
  }
};

export const getMarkets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issuer, status, limit = 20, offset = 0 } = req.query;

    // Build query
    const query: any = {};
    if (issuer) query.issuer = issuer;
    if (status) query.status = status;

    // Execute query with pagination
    const markets = await Market
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .exec();

    const total = await Market.countDocuments(query);

    res.status(200).json({
      success: true,
      data: markets,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching markets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getMarket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { marketId } = req.params;

    const market = await Market.findOne({ marketId }).exec();

    if (!market) {
      res.status(404).json({
        success: false,
        error: 'Market not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: market
    });

  } catch (error) {
    console.error('❌ Error fetching market:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
