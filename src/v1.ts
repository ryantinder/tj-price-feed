import { MulticallWrapper } from 'ethers-multicall-provider';
import { FullPairResults, Pair, PairAddress } from './lib/interfaces';
import { BAD_PAIR, E18, PROVIDERS, V1_FACTORY_ADDRESSES } from './lib/constants';
import { BigNumber, Contract, constants, utils } from 'ethers';
import { V1_FACTORY_ABI, V1_PAIR_ABI } from './lib/abi';
import { TEN_POW, getDecimals, sortTokens } from './lib/helpers';
import { ERROR_RESERVES_ZERO, ERROR_V1_PAIR_NOT_FOUND, ERROR_V1_GET_RESERVES_FAILED } from './lib/error';
import { v1CachePairExists, v1CachePairRead, v1CachePairSet, v1CacheReservesExists, v1CacheReservesRead, v1CacheReservesSet } from './lib/cache';

export const batchPriceV1 = async (chainid: number, pairs: Pair[]) : Promise<[number, FullPairResults[]]> => {
	const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
	const V1_FACTORY = new Contract(V1_FACTORY_ADDRESSES[chainid], V1_FACTORY_ABI, multicall_provider);
	const V1_PAIR = new Contract(constants.AddressZero, V1_PAIR_ABI, multicall_provider)

	// batch pair calls together
	console.time('batch rpc')
	const results = await Promise.all([
		// batch block number query into rpc call
		PROVIDERS[chainid].getBlockNumber().catch(() => 0),
		// look for each pair in the cache, then rpc call if miss
		...pairs.map( (pair) : Promise<PairAddress> => {
			const [token0, token1] = sortTokens(pair.asset, pair.quote)
			if (v1CachePairExists(token0, token1)) {
				console.log('V1 Pair cache hit')
				return Promise.resolve({ ...pair, address: v1CachePairRead(token0, token1) })
			}
			return V1_FACTORY.getPair(token0, token1)
				.then( (addr: string ) : PairAddress => {
					if (addr == constants.AddressZero) {
						return { ...pair, address: addr, err: ERROR_V1_PAIR_NOT_FOUND(pair.asset, pair.quote)}
					} else {
						// cache pair for the future
						v1CachePairSet(token0, token1, utils.getAddress(addr))
						return { ...pair, address: utils.getAddress(addr) }
					}
				})
				.catch( (e: any) => { console.log(e); return { ...pair, err: ERROR_V1_PAIR_NOT_FOUND(pair.asset, pair.quote)}})
		})
	])
	console.timeLog('batch rpc')
	const block_number = results[0] as number
	const pair_addresses = results.slice(1) as PairAddress[]
	const prices: FullPairResults[] = await Promise.all(
		pair_addresses.map( (pair_addr: PairAddress) : Promise<FullPairResults> => {
			if (pair_addr.err) return Promise.resolve({ ...BAD_PAIR, ...pair_addr})

			// check cache first
			if (v1CacheReservesExists(pair_addr.address)) {
				const cache = v1CacheReservesRead(pair_addr.address)
				console.log(`Pair last reported ${cache.block_number}, current ${block_number}`)
				if (block_number == cache.block_number) {
					console.log('Reserves cache hit')
					const [token0, token1] = sortTokens(pair_addr.asset, pair_addr.quote)
					const dec0 = getDecimals(chainid, token0)
					const dec1 = getDecimals(chainid, token1)
					const xToY = calcXtoY(cache.reserves0, cache.reserves1, dec0, dec1)
					return Promise.resolve({
						...pair_addr, 
						reserve0: parseFloat(utils.formatUnits(cache.reserves0, dec0)), 
						reserve1: parseFloat(utils.formatUnits(cache.reserves1, dec1)),
						price: xToY,
						yToX: xToY != 0 ? 1 / xToY : 0
					})
				}
			}
			// pull from contract
			return V1_PAIR.attach(pair_addr.address).getReserves()
				.then( (reserves: BigNumber[]) : FullPairResults => {
					if (reserves[0].isZero()) return {...BAD_PAIR, ...pair_addr, err: ERROR_RESERVES_ZERO()}
					const [token0, token1] = sortTokens(pair_addr.asset, pair_addr.quote)
					const dec0 = getDecimals(chainid, token0)
					const dec1 = getDecimals(chainid, token1)
					const xToY = calcXtoY(reserves[0], reserves[1], dec0, dec1)

					v1CacheReservesSet(pair_addr.address, reserves[0], reserves[1], block_number)

					return {
						...pair_addr, 
						reserve0: parseFloat(utils.formatUnits(reserves[0], dec0)), 
						reserve1: parseFloat(utils.formatUnits(reserves[1], dec1)),
						price: xToY,
						yToX: xToY != 0 ? 1 / xToY : 0
					}
                    
				})
				.catch(() => {
					return {...BAD_PAIR, ...pair_addr, err: ERROR_V1_GET_RESERVES_FAILED(pair_addr.address)}
				})
		})
	)
	console.timeEnd('batch rpc')
	return [block_number, prices]
}

const calcXtoY = (reserves0: BigNumber, reserves1: BigNumber, dec0: number, dec1: number) => {
	if (dec0 > dec1) {
		const diff = dec0 - dec1
		return parseFloat(utils.formatUnits(reserves1.mul( TEN_POW(diff)).mul(E18).div(reserves0), 18))
	} else {
		const diff = dec1 - dec0
		return parseFloat(utils.formatUnits(reserves1.mul(E18).div(reserves0.mul(TEN_POW(diff))), 18))
	}
}
