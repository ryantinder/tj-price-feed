import { MulticallWrapper } from "ethers-multicall-provider";
import { FullPairResults, Pair, PairAddress } from "./lib/interfaces";
import { PROVIDERS } from "./lib/constants";
import { BigNumber, Contract, constants, utils } from "ethers";
import { V2_FACTORY_ABI, V2_PAIR } from "./lib/abi";
import { getDecimals, getPriceFromId, sortTokens, u128x128toDec } from "./lib/helpers";

export const batchPriceV2 = async (pairs: Pair[]) => {
    const chainid = 43114;
    const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
    const V2_FACTORY = new Contract("0x6E77932A92582f504FF6c4BdbCef7Da6c198aEEf", V2_FACTORY_ABI, multicall_provider);
    const V2_1_PAIR = new Contract(constants.AddressZero, V2_PAIR, multicall_provider)
    // batch pair calls together
    console.time("batch rpc")
    const pair_addresses = await Promise.all(
        pairs.map( (pair) : Promise<PairAddress> => {
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            return V2_FACTORY.getLBPairInformation(token0, token1, pair.bin).then( ([,addr,,] : [never,string,never,never]) : PairAddress => { return { ...pair, address: utils.getAddress(addr) }})
        })
    )
    console.timeLog("batch rpc")
    const prices: FullPairResults[] = await Promise.all(
        pair_addresses.map( (pair_addr: PairAddress) : Promise<FullPairResults> => {
            const pair_contract = V2_1_PAIR.attach(pair_addr.address)
            return Promise.all([pair_contract.getReservesAndId(), pair_contract.tokenX(), pair_contract.tokenY()])
                .then( ([[reserve0, reserve1, activeId], token0, token1]: [[BigNumber, BigNumber, BigNumber], string, string]) : FullPairResults => { 
                    const dec0 = getDecimals(chainid, token0)
                    const dec1 = getDecimals(chainid, token1)
                    const priceu128x128 = getPriceFromId(activeId.toNumber(), pair_addr.bin)
                    const price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), dec0 == dec1 ? 18 : 30))
                    return { 
                        ...pair_addr, 
                        reserve0: parseFloat(utils.formatUnits(reserve0, dec0)), 
                        reserve1: parseFloat(utils.formatUnits(reserve1, dec1)),
                        xToY: price, 
                        yToX: 1 / price}
                })
        })
    )
    console.timeEnd("batch rpc")
    return prices

}