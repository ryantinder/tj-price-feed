import { MulticallWrapper } from "ethers-multicall-provider";
import { FullPairResults, Pair, PairAddress } from "./lib/interfaces";
import { BAD_PAIR, PROVIDERS } from "./lib/constants";
import { BigNumber, Contract, constants, utils } from "ethers";
import { V2_1_FACTORY_ABI, V2_1_PAIR_ABI } from "./lib/abi";
import { getDecimals, getPriceFromId, sortTokens, u128x128toDec } from "./lib/helpers";
import { ERROR_V2_1_PAIR_READ_FAILED, ERROR_V2_1_PRICE_MATH_FAILED, ERROR_V2_PAIR_NOT_FOUND } from "./lib/error";
import { v2_1CachePairExists, v2_1CachePairRead, v2_1CachePairSet, v2_1CacheReservesExists, v2_1CacheReservesRead, v2_1CacheReservesSet } from "./lib/cache";

export const batchPriceV21 = async (chainid: number, pairs: Pair[]) : Promise<[number, FullPairResults[]]> => {
    const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
    const V2_1_FACTORY = new Contract("0x8e42f2F4101563bF679975178e880FD87d3eFd4e", V2_1_FACTORY_ABI, multicall_provider);
    const V2_1_PAIR = new Contract(constants.AddressZero, V2_1_PAIR_ABI, multicall_provider)
    // batch pair calls together
    console.time("batch rpc")
    const results = await Promise.all([
        // batch each block number query into rpc call
        PROVIDERS[chainid].getBlockNumber().catch(() => 0),
        // look for each pair in cache, then rpc call if miss
        ...pairs.map( (pair) : Promise<PairAddress> => {
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            if (v2_1CachePairExists(token0, token1, pair.bin)) {
                console.log("V2_1 Pair cache hit")
                return Promise.resolve({...pair, address: v2_1CachePairRead(token0, token1, pair.bin)})
            }

            return V2_1_FACTORY.getLBPairInformation(token0, token1, pair.bin)
                .then( ([,addr,,] : [never,string,never,never]) : PairAddress => { 
                    if (addr == constants.AddressZero) {
                        return { ...pair, address: constants.AddressZero, err: ERROR_V2_PAIR_NOT_FOUND(pair.asset, pair.quote, pair.bin)}
                    } else {
                        v2_1CachePairSet(pair.bin, token0, token1,  utils.getAddress(addr))
                        return { ...pair, address: utils.getAddress(addr) }
                    }
                })
                .catch(() => {
                    return { ...pair, err: ERROR_V2_PAIR_NOT_FOUND(pair.asset, pair.quote, pair.bin)}
                })
        })
    ])
    console.timeLog("batch rpc")
    const block_number = results[0] as number
    const pair_addresses = results.slice(1) as PairAddress[]
    const prices: FullPairResults[] = await Promise.all(
        pair_addresses.map( (pair_addr: PairAddress) : Promise<FullPairResults> => {
            if (pair_addr.err) return Promise.resolve({ ...BAD_PAIR, ...pair_addr })
            
            if (v2_1CacheReservesExists(pair_addr.address)) {
                const cache = v2_1CacheReservesRead(pair_addr.address)
                console.log(`V2_1 Pair last reported ${block_number - cache.block_number} blocks ago`)
                if (block_number == cache.block_number) {
                    console.log(`V2_1 Reserves cache hit`)
                    const dec0 = getDecimals(chainid, cache.token0)
                    const dec1 = getDecimals(chainid, cache.token1)
                    try {
                        const priceu128x128 = getPriceFromId(cache.activeId, pair_addr.bin)
                        let price = 0;
                        if (dec0 == dec1) {
                            price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 18))
                        } else if (dec0 == 8 || dec1 == 8) {
                            price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 15))
                        } else {
                            price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 30))
                        }
                        return Promise.resolve({ 
                            ...pair_addr, 
                            reserve0: parseFloat(utils.formatUnits(cache.reserves0, dec0)), 
                            reserve1: parseFloat(utils.formatUnits(cache.reserves1, dec1)),
                            price, 
                            yToX: price != 0 ? 1 / price : price
                        })
                    } catch (e) {}
                }
            }
            
            const pair_contract = V2_1_PAIR.attach(pair_addr.address)
            return Promise.all([pair_contract.getActiveId(), pair_contract.getReserves(), pair_contract.getTokenX(), pair_contract.getTokenY()])
                .then( ([activeId, [reserves0, reserves1], token0, token1] : [number, [BigNumber, BigNumber], string, string]) : FullPairResults => { 
                    const dec0 = getDecimals(chainid, token0)
                    const dec1 = getDecimals(chainid, token1)
                    try {
                        const priceu128x128 = getPriceFromId(activeId, pair_addr.bin)
                        let price = 0;
                        if (dec0 == dec1) {
                            price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 18))
                        } else if (dec0 == 8 || dec1 == 8) {
                            price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 15))
                        } else {
                            price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 30))
                        }
                        v2_1CacheReservesSet(pair_addr.address, block_number, activeId, reserves0, reserves1, token0, token1)
                        return { 
                            ...pair_addr, 
                            reserve0: parseFloat(utils.formatUnits(reserves0, dec0)), 
                            reserve1: parseFloat(utils.formatUnits(reserves1, dec1)),
                            price, 
                            yToX: price != 0 ? 1 / price : price
                        }
                    } catch (e) {
                        return {
                            ...BAD_PAIR, ...pair_addr, err: ERROR_V2_1_PRICE_MATH_FAILED(pair_addr.address)
                        }
                    }
                })
                .catch(() => {
                    return { ...BAD_PAIR, ...pair_addr, err: ERROR_V2_1_PAIR_READ_FAILED(pair_addr.address)}
                })
        })
    )
    console.timeEnd("batch rpc")
    return [block_number, prices]

}