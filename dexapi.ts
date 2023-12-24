// dexapi.ts

import axios from 'axios';

export interface TokenInfo {
  schemaVersion: string;
  pairs: Pair[];
}

interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: Token;
  quoteToken: Token;
  priceNative: string;
  priceUsd: string;
  txns: Transactions;
  volume: Volume;
  priceChange: PriceChange;
  liquidity: Liquidity;
  fdv: number;
  pairCreatedAt: number;
}

interface Token {
  address: string;
  name: string;
  symbol: string;
}

interface Transactions {
  m5: TransactionStats;
  h1: TransactionStats;
  h6: TransactionStats;
  h24: TransactionStats;
}

interface TransactionStats {
  buys: number;
  sells: number;
}

interface Volume {
  h24: number;
  h6: number;
  h1: number;
  m5: number;
}

interface PriceChange {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
}

interface Liquidity {
  usd: number;
  base: number;
  quote: number;
}

// Function to fetch token information from DEX Screener API
export async function getTokenInfo(contract: string): Promise<TokenInfo> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${contract}`);
    return response.data;
  } catch (error:any) {
    console.error('Error fetching token information:', error.message);
    throw error;
  }
}
