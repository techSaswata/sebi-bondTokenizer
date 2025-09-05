// Run this script with: node deriveMarketPDA.js
const { PublicKey } = require('@solana/web3.js');

const BOND_FACTORY_PROGRAM_ID = new PublicKey('EhxFepaeryGJh1S2g4JmQGcaXMtSK5akEF9fjwst2Qjb');
const issuerName = 'TestIssuerShortName';

const [marketPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('market'), Buffer.from(issuerName)],
  BOND_FACTORY_PROGRAM_ID
);

console.log('Market PDA:', marketPda.toString());
