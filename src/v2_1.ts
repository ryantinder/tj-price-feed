import { MulticallWrapper } from 'ethers-multicall-provider';
import { FullPairResults, Pair, PairAddress } from './lib/interfaces';
import { BAD_PAIR, PROVIDERS, V2_1_FACTORY_ADDRESS } from './lib/constants';
import { BigNumber, Contract, constants, utils } from 'ethers';
import { V2_1_FACTORY_ABI, V2_1_PAIR_ABI } from './lib/abi';
import { getFullPairObj, sortTokens } from './lib/helpers';
import { ERROR_V2_1_PAIR_READ_FAILED, ERROR_V2_PAIR_NOT_FOUND } from './lib/error';
import { v2_1CachePairExists, v2_1CachePairRead, v2_1CachePairSet, v2_1CacheReservesExists, v2_1CacheReservesRead, v2_1CacheReservesSet } from './lib/cache';
import { logger } from '.';

export const batchPriceV21 = async (chainid: number, pairs: Pair[]) : Promise<[number, FullPairResults[]]> => {
	const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
	const V2_1_FACTORY = new Contract(V2_1_FACTORY_ADDRESS, V2_1_FACTORY_ABI, multicall_provider);
	const V2_1_PAIR = new Contract(constants.AddressZero, V2_1_PAIR_ABI, multicall_provider)
	// batch pair calls together
	console.time('batch rpc')
	const results = await Promise.all([
		// batch each block number query into rpc call
		PROVIDERS[chainid].getBlockNumber().catch(() => 0),
		// look for each pair in cache, then rpc call if miss
		...pairs.map( (pair) : Promise<PairAddress> => {
			const [token0, token1] = sortTokens(pair.asset, pair.quote)
			if (v2_1CachePairExists(token0, token1, pair.bin)) {
				logger.info('V2_1 Pair cache hit')
				return Promise.resolve({...pair, address: v2_1CachePairRead(token0, token1, pair.bin)})
			}

			return V2_1_FACTORY.getLBPairInformation(token0, token1, pair.bin)
				.then( ([,addr,,] : [never,string,never,never]) : PairAddress => { 
					if (addr == constants.AddressZero) {
						return { ...pair, address: addr, err: ERROR_V2_PAIR_NOT_FOUND(pair.asset, pair.quote, pair.bin)}
					} else {
						v2_1CachePairSet(pair.bin, token0, token1, utils.getAddress(addr))
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
            if (pair_addr.err) return Promise.resolve({ ...BAD_PAIR, ...pair_addr })

			if (v2_1CacheReservesExists(pair_addr.address)) {
				const cache = v2_1CacheReservesRead(pair_addr.address)
				logger.info(`V2_1 Pair last reported ${block_number - cache.block_number} blocks ago`)
				if (block_number == cache.block_number) {
					logger.info('V2_1 Reserves cache hit')
                    const res = getFullPairObj(chainid, pair_addr, block_number, cache.activeId, cache.reserves0, cache.reserves1, cache.token0, cache.token1)
                    return Promise.resolve(res)
                }
			}
            
			const pair_contract = V2_1_PAIR.attach(pair_addr.address)
			return Promise.all([pair_contract.getActiveId(), pair_contract.getReserves(), pair_contract.getTokenX(), pair_contract.getTokenY()])
				.then( ([activeId, [reserves0, reserves1], token0, token1] : [number, [BigNumber, BigNumber], string, string]) : FullPairResults => { 
                    return getFullPairObj(chainid, pair_addr, block_number, activeId, reserves0, reserves1, token0, token1)
				})
				.catch((e) => {
					logger.debug(e)
					return {
                        ...BAD_PAIR, ...pair_addr, err: ERROR_V2_1_PAIR_READ_FAILED(pair_addr.address)
                    }
				})
		})
	)
	console.timeEnd('batch rpc')
	return [block_number, prices]

}