const { PublicKey } = require('@solana/web3.js');

const programId = new PublicKey('3YwVMmAgU9dCQaTSQb71FdqUrsrUvD6vGwbQAnBFvaBE');
const [idlAddress] = PublicKey.findProgramAddressSync([
  Buffer.from('anchor:idl'),
  programId.toBuffer()
], programId);

console.log('IDL Account Address:', idlAddress.toBase58());
