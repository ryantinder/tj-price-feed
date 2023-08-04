import { BigNumber, utils } from 'ethers'
import { logger } from '..'
import { Version } from './constants'
import { Reserves } from './interfaces'
export class Cache {
    private pairs: { [token0: string] : {[token1: string] : {[bin: number] : string }} }
    
    private pair_to_last_bin: { [pair: string] : number}

    private reserves: { [pair: string] : Reserves}
    
    private version: Version
    constructor(_version: Version) {
        this.reserves = {}
        this.pairs = {}
        this.version = _version
        this.pair_to_last_bin = {}
    }

    setPair(bin: number, token0: string, token1: string, pair_addr: string) : void {
        if (!this.pairs[token0]) this.pairs[token0] = {}
        if (!this.pairs[token0][token1]) this.pairs[token0][token1] = {}
        this.pairs[token0][token1][bin] = utils.getAddress(pair_addr)
        logger.info(`${this.version} set pair ${pair_addr}`)
    }

    hasPair(bin: number, token0: string, token1: string) : boolean {
        return !!this.pairs[token0] 
        && !!this.pairs[token0][token1] 
        && !!this.pairs[token0][token1][bin]
    }
    //@dev important to check if cache entry exists before calling this function
    readPair(bin: number, token0: string, token1: string) : string {
        // if there is an outstanding request for the pair, do not make another one, wait for it to come back
        return this.pairs[token0][token1][bin];
    }

    setBin(bin: number, pair: string) : void {
        this.pair_to_last_bin[utils.getAddress(pair)] = bin;
        logger.info(`${this.version} set bin ${pair}`)
    }

    readBin(pair: string) : number {
        return this.pair_to_last_bin[utils.getAddress(pair)]
    }

    

    setReserves(	
        pair: string, 
        timestamp: number,
        block_number: number,
        activeId: number,
        reserves0: BigNumber,
        reserves1: BigNumber,
        token0: string,
        token1: string,
        localLiquidityX: BigNumber,
        localLiquidityY: BigNumber
    ) {
        this.reserves[pair] = { block_number, timestamp, activeId, reserves0, reserves1, token0, token1, localLiquidityX, localLiquidityY}
        logger.info(`${this.version} set reserves ${pair}`)
    }

    hasReserves( pair: string ) : boolean {
        return !!this.reserves[pair]
    }
    validReserves( pair: string ) : boolean {
        return Date.now() - this.reserves[pair].timestamp < 500
    }
    //@dev important to check if cache entry exists before calling this function
    readReserves( pair: string) {
        return this.reserves[pair]
    }
}