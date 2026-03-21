/**
 * USDT Configuration for Tether WDK Hackathon
 * Target: Ethereum Sepolia Testnet
 */

export const USDT_CONFIG = {
  // Sepolia USDT Address (Funded for this demo)
  SEPOLIA_ADDRESS: "0xd077a400968890eacc75cdc901f0356c943e4fdb",

  // USDT typically uses 6 decimals on many chains, but check the specific contract.
  // For this hackathon/Sepolia mock, it's usually 6.
  DECIMALS: 6,

  // Convenience helper to convert decimal amount to base unit (MNT/micro-units)
  toBaseUnit: (amount) => {
    return BigInt(Math.floor(Number(amount) * 10 ** 6));
  },

  // Convenience helper to convert base unit string/bigint to decimal number
  fromBaseUnit: (baseUnit) => {
    return Number(baseUnit) / 10 ** 6;
  },
};
