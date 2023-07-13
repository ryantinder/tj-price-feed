export interface TJPairInfo {
    pairAddress: string,
    chain: string,
    name: string,
    status: string,
    version: string,
    tokenX: {
        address: string,
        name: string,
        symbol: string,
        decimals: number,
        priceUsd: number,
        priceNative: number
    },
    tokenY: {
        address: string,
        name: string,
        symbol: string,
        decimals: number,
        priceUsd: number,
        priceNative: number
    },
    reserveX: number,
    reserveY: number,
    lbBinStep: number,
    liquidityUsd: number,
    liquidityNative: number,
}