import { Version } from "../common"
import { Pair } from "./interfaces"

export const ERROR_V1_PAIR_NOT_FOUND = (base: string, quote: string) => `Pair not found for base ${base} and quote ${quote}. Consider checking your chainid.`
export const ERROR_PAIR_NOT_FOUND = (version: Version, pair: Pair) => `${version} Pair not found for base ${pair.asset}, quote ${pair.quote}, bin ${pair.bin}. Consider selecting a valid bin or checking your chainid.`
export const ERROR_RESERVES_ZERO = () => 'Reserves = 0, price unable to be calculated'
export const ERROR_GET_RESERVES_FAILED = (version: Version, pair_addr: string) => `${version} getReserves failed for pair: ${pair_addr}`
export const ERROR_V2_1_PAIR_READ_FAILED = (pair_addr: string) => `Contract read failed for V2.1 pair: ${pair_addr}`
export const ERROR_V2_1_PRICE_MATH_FAILED = (pair_addr: string) => `Contract read failed for V2.1 pair: ${pair_addr}`
export const ERROR_V2_PAIR_READ_FAILED = (pair_addr: string) => `Contract read failed for V2 pair: ${pair_addr}`
export const ERROR_V2_PRICE_MATH_FAILED = (pair_addr: string) => `Contract read failed for V2 pair: ${pair_addr}`