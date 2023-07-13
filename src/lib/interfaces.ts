export interface Pair {
    asset: string
    quote: string
    bin: number
}

export interface PairAddress extends Pair {
    address: string
    err?: string
}

export interface FullPairResults extends PairAddress {
    reserve0: number
    reserve1: number
    token0: string
    token1: string
    price: number
    yToX: number
}

export interface PairResponse {
    chain_id: number,
    block_number: number,
    timestamp: number
    base_asset: string,
    quote_asset: string,
    bin_id: number,
    pair_address: string,
    base_reserves: number,
    quote_reserves: number,
    version: string,
    price: number,
    inverse: number,
    err?: string,
    warn?: string
}
