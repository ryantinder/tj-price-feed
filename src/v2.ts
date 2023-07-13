import { MulticallWrapper } from 'ethers-multicall-provider';
import { FullPairResults, Pair, PairAddress } from './lib/interfaces';
import { BAD_PAIR, PROVIDERS, V2_FACTORY_ADDRESSES } from './lib/constants';
import { BigNumber, Contract, constants, utils } from 'ethers';
import { V2_FACTORY_ABI, V2_PAIR } from './lib/abi';
import { getFullPairObj, sortTokens } from './lib/helpers';
import { ERROR_V2_PAIR_NOT_FOUND, ERROR_V2_PAIR_READ_FAILED, ERROR_V2_PRICE_MATH_FAILED } from './lib/error';
import { v2CachePairExists, v2CachePairRead, v2CachePairSet, v2CacheReservesExists, v2CacheReservesRead, v2CacheReservesSet } from './lib/cache';
import { logger } from '.';


export const batchPriceV2 = async (chainid: number, pairs: Pair[]) : Promise<[number, FullPairResults[]]>=> {
	const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
	const V2_FACTORY = new Contract(V2_FACTORY_ADDRESSES[chainid], V2_FACTORY_ABI, multicall_provider);
	const V2_1_PAIR = new Contract(constants.AddressZero, V2_PAIR, multicall_provider)
	// batch pair calls together
	console.time('batch rpc')
	const results = await Promise.all([
        // batch block number call with first rpc batch
		PROVIDERS[chainid].getBlockNumber(),
		...pairs.map( (pair) : Promise<PairAddress> => {
			const [token0, token1] = sortTokens(pair.asset, pair.quote)
            // check cache
			if (v2CachePairExists(token0, token1, pair.bin)) {
				logger.info('V2_1 Pair cache hit')
				return Promise.resolve({...pair, address: v2CachePairRead(token0, token1, pair.bin)})
			}

            // fetch if cache misses
			return V2_FACTORY.getLBPairInformation(token0, token1, pair.bin)
				.then( ([,addr,,] : [never,string,never,never]) : PairAddress => { 
					if (addr == constants.AddressZero) {
						return { ...pair, address: addr, err: ERROR_V2_PAIR_NOT_FOUND(pair.asset, pair.quote, pair.bin)}
					} else {
						v2CachePairSet(pair.bin, token0, token1, utils.getAddress(addr))
						return { ...pair, address: utils.getAddress(addr) }
					}
				})
				.catch((e: any) => {
                    logger.debug(e);
					return { ...pair, err: ERROR_V2_PAIR_NOT_FOUND(pair.asset, pair.quote, pair.bin)}
				})
		})
	])
	console.timeLog('batch rpc')
	const block_number = results[0] as number
	const pair_addresses = results.slice(1) as PairAddress[]
	const prices: FullPairResults[] = await Promise.all(
		pair_addresses.map( (pair_addr: PairAddress) : Promise<FullPairResults> => {
            // skip if an error has previously occurred
            if (pair_addr.err) return Promise.resolve({ ...BAD_PAIR, ...pair_addr })

            // check cache
			if (v2CacheReservesExists(pair_addr.address)) {
				const cache = v2CacheReservesRead(pair_addr.address)
				logger.info(`V2 Pair last reported ${block_number - cache.block_number} blocks ago`)
				if (block_number == cache.block_number) {
					logger.info('V2 Reserves cache hit')
                    const res = getFullPairObj(chainid, pair_addr, block_number, cache.activeId, cache.reserves0, cache.reserves1, cache.token0, cache.token1)
                    return Promise.resolve(res)
                }
			}
            
            // go fetch data if cache misses
			const pair_contract = V2_1_PAIR.attach(pair_addr.address)
			return Promise.all([pair_contract.getReservesAndId(), pair_contract.tokenX(), pair_contract.tokenY()])
				.then( ([[reserves0, reserves1, activeId], token0, token1]: [[BigNumber, BigNumber, number], string, string]) : FullPairResults => {                     
                    return getFullPairObj(chainid, pair_addr, block_number, activeId, reserves0, reserves1, token0, token1)
				})
				.catch((e) => {
                    logger.debug(e)
					return {
                        ...BAD_PAIR, ...pair_addr, err: ERROR_V2_PAIR_READ_FAILED(pair_addr.address)
                    }
				})
		})
	)
	console.timeEnd('batch rpc')
	return [block_number, prices]

}