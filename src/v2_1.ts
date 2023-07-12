import { MulticallWrapper } from "ethers-multicall-provider";
import { FullPairResults, Pair, PairAddress } from "./lib/interfaces";
import { BAD_PAIR, PROVIDERS } from "./lib/constants";
import { BigNumber, Contract, constants, utils } from "ethers";
import { V2_1_FACTORY_ABI, V2_1_PAIR_ABI } from "./lib/abi";
import { getDecimals, getPriceFromId, sortTokens, u128x128toDec } from "./lib/helpers";
import { ERROR_V2_1_PAIR_READ_FAILED, ERROR_V2_1_PRICE_MATH_FAILED, ERROR_V2_PAIR_NOT_FOUND } from "./lib/error";

export const batchPriceV21 = async (chainid: number, pairs: Pair[]) : Promise<[number, FullPairResults[]]> => {
    const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
    const V2_1_FACTORY = new Contract("0x8e42f2F4101563bF679975178e880FD87d3eFd4e", V2_1_FACTORY_ABI, multicall_provider);
    const V2_1_PAIR = new Contract(constants.AddressZero, V2_1_PAIR_ABI, multicall_provider)
    // batch pair calls together
    console.time("batch rpc")
    console.timeLog("batch rpc")
    const results = await Promise.all([
        PROVIDERS[chainid].getBlockNumber().catch(() => 0),
        ...pairs.map( (pair) : Promise<PairAddress> => {
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            return V2_1_FACTORY.getLBPairInformation(token0, token1, pair.bin)
                .then( ([,addr,,] : [never,string,never,never]) : PairAddress => { 
                    if (addr == constants.AddressZero) return { ...pair, address: constants.AddressZero, err: ERROR_V2_PAIR_NOT_FOUND(pair.asset, pair.quote, pair.bin)}
                    return { ...pair, address: utils.getAddress(addr) }
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
            const pair_contract = V2_1_PAIR.attach(pair_addr.address)
            return Promise.all([pair_contract.getActiveId(), pair_contract.getReserves(), pair_contract.getTokenX(), pair_contract.getTokenY()])
                .then( ([activeId, [reserves0, reserves1], token0, token1] : [number, [BigNumber, BigNumber], string, string]) : FullPairResults => { 
                    const dec0 = getDecimals(chainid, token0)
                    const dec1 = getDecimals(chainid, token1)
                    try {
                        const priceu128x128 = getPriceFromId(activeId, pair_addr.bin)
                        const price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), dec0 == dec1 ? 18 : 30))
                        console.log(reserves0.toString(), dec0, token0)
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