import { MulticallWrapper } from "ethers-multicall-provider";
import { FullPairResults, Pair, PairAddress } from "./lib/interfaces";
import { E18, PROVIDERS } from "./lib/constants";
import { BigNumber, Contract, constants, utils } from "ethers";
import { V1_FACTORY_ABI, V1_PAIR_ABI } from "./lib/abi";
import { TEN_POW, getDecimals, sortTokens } from "./lib/helpers";

export const batchPriceV1 = async (pairs: Pair[]) => {
    // v1 is only on avax
    const chainid = 43114;
    const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
    const V1_FACTORY = new Contract("0x9ad6c38be94206ca50bb0d90783181662f0cfa10", V1_FACTORY_ABI, multicall_provider);
    const V1_PAIR = new Contract(constants.AddressZero, V1_PAIR_ABI, multicall_provider)

    // batch pair calls together
    console.time("batch rpc")
    const pair_addresses = await Promise.all(
        pairs.map( (pair) : Promise<PairAddress> => {
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            return V1_FACTORY.getPair(token0, token1).then( (addr: string ) : PairAddress => { return { ...pair, address: utils.getAddress(addr) }})
        })
    )
    console.timeLog("batch rpc")
    const results: FullPairResults[] = await Promise.all(
        pair_addresses.map( (pair_addr: PairAddress) : Promise<FullPairResults> => {
            const pair_contract = V1_PAIR.attach(pair_addr.address)
            return pair_contract.getReserves().then( (reserves: BigNumber[]) : FullPairResults => {
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
                    xToY,
                    yToX: 1 / xToY
                }
                
            })
        })
    )
    console.timeEnd("batch rpc")
    return results
}
