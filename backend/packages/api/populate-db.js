const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

const sampleMarkets = [
  {
    issuer: "11111111111111111111111111111112", // System Program
    bondName: "Krazybee Services Bond 2027",
    bondSymbol: "KRAZY27",
    totalSupply: 1000000,
    maturityDate: "2027-08-12",
    couponRate: 10.65,
    faceValue: 100000,
    currentPrice: 98903,
    totalBondsIssued: 1000,
    bondsSold: 150,
    status: "active"
  },
  {
    issuer: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token Program
    bondName: "Keertana Finserv Bond 2027",
    bondSymbol: "KEER27",
    totalSupply: 500000,
    maturityDate: "2027-08-19",
    couponRate: 11.1,
    faceValue: 100000,
    currentPrice: 97697,
    totalBondsIssued: 500,
    bondsSold: 75,
    status: "active"
  },
  {
    issuer: "Sysvar1nstructions1111111111111111111111111", // Sysvar Instructions
    bondName: "EarlySalary Services Bond 2027",
    bondSymbol: "EARLY27",
    totalSupply: 750000,
    maturityDate: "2027-03-05",
    couponRate: 10.7,
    faceValue: 100000,
    currentPrice: 99503,
    totalBondsIssued: 750,
    bondsSold: 200,
    status: "active"
  },
  {
    issuer: "SysvarC1ock11111111111111111111111111111111", // Sysvar Clock
    bondName: "HDFC Bank Corporate Bond 2025",
    bondSymbol: "HDFCB25",
    totalSupply: 2000000,
    maturityDate: "2025-12-15",
    couponRate: 8.5,
    faceValue: 100000,
    currentPrice: 101000,
    totalBondsIssued: 2000,
    bondsSold: 1200,
    status: "active"
  },
  {
    issuer: "SysvarRent111111111111111111111111111111111", // Sysvar Rent
    bondName: "Reliance Infrastructure Bond 2026",
    bondSymbol: "RINFRA26",
    totalSupply: 1500000,
    maturityDate: "2026-06-30",
    couponRate: 9.2,
    faceValue: 100000,
    currentPrice: 99800,
    totalBondsIssued: 1500,
    bondsSold: 850,
    status: "active"
  }
];

async function populateMarkets() {
  console.log('🚀 Starting to populate markets...');
  
  for (const market of sampleMarkets) {
    try {
      console.log(`📊 Creating market: ${market.bondName}`);
      const response = await axios.post(`${API_BASE}/markets`, market);
      console.log(`✅ Created market with ID: ${response.data.data.marketId}`);
    } catch (error) {
      console.error(`❌ Error creating market ${market.bondName}:`, error.response?.data || error.message);
    }
  }
  
  console.log('🎉 Finished populating markets!');
}

populateMarkets();
