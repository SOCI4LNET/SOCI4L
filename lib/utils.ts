import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function formatAddress(address: string, length = 6): string {
  if (!address) return ""
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export function formatBalance(balance: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals)
  const whole = balance / divisor
  const remainder = balance % divisor
  if (remainder === BigInt(0)) {
    return whole.toString()
  }
  const decimalsStr = remainder.toString().padStart(decimals, "0")
  const trimmed = decimalsStr.replace(/0+$/, "")
  return trimmed ? `${whole}.${trimmed}` : whole.toString()
}
