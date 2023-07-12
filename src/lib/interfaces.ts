export interface Pair {
    asset: string
    quote: string
    bin: number
}

export interface PairAddress extends Pair {
    address: string
}

export interface FullPairResults extends PairAddress {
    reserve0: number
    reserve1: number
    xToY: number
    yToX: number
}

