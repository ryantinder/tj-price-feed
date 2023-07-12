import { MulticallWrapper } from "ethers-multicall-provider";
import { FullPairResults, Pair, PairAddress } from "./lib/interfaces";
import { BAD_PAIR, E18, PROVIDERS, V1_FACTORY_ADDRESSES } from "./lib/constants";
import { BigNumber, Contract, constants, utils } from "ethers";
import { V1_FACTORY_ABI, V1_PAIR_ABI } from "./lib/abi";
import { TEN_POW, getDecimals, sortTokens } from "./lib/helpers";
import { ERROR_RESERVES_ZERO, ERROR_V1_PAIR_NOT_FOUND, ERROR_V1_GET_RESERVES_FAILED } from "./lib/error";

export const batchPriceV1 = async (chainid: number, pairs: Pair[]) : Promise<[number, FullPairResults[]]> => {
    const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
    const V1_FACTORY = new Contract(V1_FACTORY_ADDRESSES[chainid], V1_FACTORY_ABI, multicall_provider);
    const V1_PAIR = new Contract(constants.AddressZero, V1_PAIR_ABI, multicall_provider)

    // batch pair calls together
    console.time("batch rpc")
    const results = await Promise.all([
        PROVIDERS[chainid].getBlockNumber().catch(() => 0),
        ...pairs.map( (pair) : Promise<PairAddress> => {
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            return V1_FACTORY.getPair(token0, token1)
            .then( (addr: string ) : PairAddress => {
                if (addr == constants.AddressZero) return { ...pair, address: addr, err: ERROR_V1_PAIR_NOT_FOUND(pair.asset, pair.quote)}
                return { ...pair, address: utils.getAddress(addr) }})
            .catch( () => { return { ...pair, err: ERROR_V1_PAIR_NOT_FOUND(pair.asset, pair.quote)}})
        })
    ])
    console.timeLog("batch rpc")
    const block_number = results[0] as number
    const pair_addresses = results.slice(1) as PairAddress[]
    const prices: FullPairResults[] = await Promise.all(
        pair_addresses.map( (pair_addr: PairAddress) : Promise<FullPairResults> => {

            if (pair_addr.err) return Promise.resolve({ ...BAD_PAIR, ...pair_addr})

            const pair_contract = V1_PAIR.attach(pair_addr.address)
            return pair_contract.getReserves()
                .then( (reserves: BigNumber[]) : FullPairResults => {
                    if (reserves[0].isZero()) return {...BAD_PAIR, ...pair_addr, err: ERROR_RESERVES_ZERO()}
                    const [token0, token1] = sortTokens(pair_addr.asset, pair_addr.quote)
                    const dec0 = getDecimals(chainid, token0)
                    const dec1 = getDecimals(chainid, token1)
                    let xToY = 0
                    if (dec0 > dec1) {
                        const diff = dec0 - dec1
                        xToY = parseFloat(utils.formatUnits(reserves[1].mul( TEN_POW(diff)).mul(E18).div(reserves[0]), 18))
                    } else {
                        const diff = dec1 - dec0
                        xToY = parseFloat(utils.formatUnits(reserves[1].mul(E18).div(reserves[0].mul(TEN_POW(diff))), 18))
                    }
                    return {
                        ...pair_addr, 
                        reserve0: parseFloat(utils.formatUnits(reserves[0], dec0)), 
                        reserve1: parseFloat(utils.formatUnits(reserves[1], dec1)),
                        price: xToY,
                        yToX: xToY != 0 ? 1 / xToY : 0
                    }
                    
                })
                .catch(() => {
                    return {...BAD_PAIR, ...pair_addr, err: ERROR_V1_GET_RESERVES_FAILED(pair_contract.address)}
                })
        })
    )
    console.timeEnd("batch rpc")
    return [block_number, prices]
}
