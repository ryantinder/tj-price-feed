import { BigNumber, utils } from 'ethers'
import { logger } from '..'
import { Version } from '../common'
/*/////////////////////////////////////////////
                    V1
/////////////////////////////////////////////*/
const V1_PAIR_CACHE: { [token0: string] : {[token1: string] : string} } = {}
const V1_RESERVES_CACHE: { [pair: string] : {
    block_number: number,
    reserves0: BigNumber,
    reserves1: BigNumber
}} = {}

export const v1CachePairSet = (token0: string, token1: string, pair: string) => {
	if (!V1_PAIR_CACHE[token0]) V1_PAIR_CACHE[token0] = {}
	V1_PAIR_CACHE[token0][token1] = utils.getAddress(pair)
	console.log('V1 pair cached')
}

export const v1CachePairExists = (token0: string, token1: string) : boolean => {
	return !!V1_PAIR_CACHE[token0] && !!V1_PAIR_CACHE[token0][token1]
} 

export const v1CachePairRead = (token0: string, token1: string) : string => {
	return V1_PAIR_CACHE[token0][token1]
} 

export const v1CacheReservesSet = (pair: string, reserves0: BigNumber, reserves1: BigNumber, block_number: number) => {
	V1_RESERVES_CACHE[pair] = { reserves0, reserves1, block_number }
	console.log('V1 reserves cached')
}

export const v1CacheReservesExists = (pair: string) : boolean => {
	return !!V1_RESERVES_CACHE[pair]
} 

export const v1CacheReservesRead = (pair: string) => {
	return V1_RESERVES_CACHE[pair]
}

/*/////////////////////////////////////////////
                    V2
/////////////////////////////////////////////*/


const V2_PAIR_CACHE: { [token0: string] : {[token1: string] : {[bin: number] : string }} } = {}
const V2_RESERVES_CACHE: { [pair: string] : {
    block_number: number,
    activeId: number,
    reserves0: BigNumber,
    reserves1: BigNumber,
    token0: string,
    token1: string
}} = {}

export const v2CachePairSet = (bin: number, token0: string, token1: string, pair: string) => {
	if (!V2_PAIR_CACHE[token0]) V2_PAIR_CACHE[token0] = {}
	if (!V2_PAIR_CACHE[token0][token1]) V2_PAIR_CACHE[token0][token1] = {}
	V2_PAIR_CACHE[token0][token1][bin] = utils.getAddress(pair)
	console.log('V2 pair cached')
}

export const v2CachePairExists = (token0: string, token1: string, bin: number) : boolean => {
	return !!V2_PAIR_CACHE[token0] && !!V2_PAIR_CACHE[token0][token1] && !!V2_PAIR_CACHE[token0][token1][bin]
} 

export const v2CachePairRead = (token0: string, token1: string, bin: number) : string => {
	return V2_PAIR_CACHE[token0][token1][bin]
}

export const v2CacheReservesSet = (
	pair: string, 
	block_number: number,
	activeId: number,
	reserves0: BigNumber,
	reserves1: BigNumber,
	token0: string,
	token1: string
) => {
	V2_RESERVES_CACHE[pair] = { block_number, activeId, reserves0, reserves1, token0, token1 }
	console.log('V2 reserves cached')
}

export const v2CacheReservesExists = (pair: string) : boolean => {
	return !!V2_RESERVES_CACHE[pair]
} 

export const v2CacheReservesRead = (pair: string) => {
	return V2_RESERVES_CACHE[pair]
} 


/*/////////////////////////////////////////////
                    V2.1
/////////////////////////////////////////////*/

export class Cache {
    private pairs: { [token0: string] : {[token1: string] : {[bin: number] : string }} }
    
    private reserves: { [pair: string] : {
        timestamp: number,
        block_number: number,
        activeId: number,
        reserves0: BigNumber,
        reserves1: BigNumber,
        token0: string,
        token1: string
    }}
    
    private version: Version
    constructor(_version: Version) {
        this.reserves = {}
        this.pairs = {}
        this.version = _version
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

    

    setReserves(	
        pair: string, 
        timestamp: number,
        block_number: number,
        activeId: number,
        reserves0: BigNumber,
        reserves1: BigNumber,
        token0: string,
        token1: string
    ) {
        this.reserves[pair] = { block_number, timestamp, activeId, reserves0, reserves1, token0, token1 }
        logger.info(`Pair cached ${pair}`)
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

const V2_1_PAIR_CACHE: { [token0: string] : {[token1: string] : {[bin: number] : string }} } = {}
const V2_1_RESERVES_CACHE: { [pair: string] : {
    timestamp: number,
    block_number: number,
    activeId: number,
    reserves0: BigNumber,
    reserves1: BigNumber,
    token0: string,
    token1: string
}} = {}
export const v2_1CachePairSet = (bin: number, token0: string, token1: string, pair: string) => {
	if (!V2_1_PAIR_CACHE[token0]) V2_1_PAIR_CACHE[token0] = {}
	if (!V2_1_PAIR_CACHE[token0][token1]) V2_1_PAIR_CACHE[token0][token1] = {}
	V2_1_PAIR_CACHE[token0][token1][bin] = utils.getAddress(pair)
}

export const v2_1CachePairExists = (token0: string, token1: string, bin: number) : boolean => {
	return !!V2_1_PAIR_CACHE[token0] && !!V2_1_PAIR_CACHE[token0][token1] && !!V2_1_PAIR_CACHE[token0][token1][bin]
} 

export const v2_1CachePairRead = (token0: string, token1: string, bin: number) : string => {
	return V2_1_PAIR_CACHE[token0][token1][bin]
} 

export const v2_1CacheReservesSet = (
	pair: string, 
	timestamp: number,
    block_number: number,
	activeId: number,
	reserves0: BigNumber,
	reserves1: BigNumber,
	token0: string,
	token1: string
) => {
	V2_1_RESERVES_CACHE[pair] = { block_number, timestamp, activeId, reserves0, reserves1, token0, token1 }
	logger.info('V2_1 reserves cached')
}

export const v2_1CacheReservesExists = (pair: string) : boolean => {
	return !!V2_1_RESERVES_CACHE[pair]
} 

export const v2_1CacheReservesRead = (pair: string) => {
	return V2_1_RESERVES_CACHE[pair]
} 
