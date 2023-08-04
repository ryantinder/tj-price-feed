import { Contract, utils } from "ethers";
import { FullPairResults, Pair, PairAddress, PairResponse } from "./lib/interfaces";
import { RPCManager } from "./RpcManager";
import { MULTICALL_PROVIDERS, V1_FACTORY_ADDRESSES, V2_1_FACTORY_ADDRESS, V2_FACTORY_ADDRESSES, Version } from "./lib/constants";
import { logger } from ".";
import { V1_FACTORY_ABI, V2_1_FACTORY_ABI, V2_FACTORY_ABI } from "./lib/abi";


const RPC_MANAGERS = [
    new RPCManager(Version.V1),
    new RPCManager(Version.V2),
    new RPCManager(Version.V2_1)
]

export const fetchPrices = async (chainid: number, pairs: Pair[], version: Version) : Promise<PairResponse[]> => {
    const rpcManager = RPC_MANAGERS[version];

    const pair_addresses: PairAddress[] = await Promise.all(
		pairs.map( (pair) : Promise<PairAddress> => rpcManager.getPairAddress(chainid, pair))
	)
	
    const fprs: FullPairResults[] = await Promise.all(
		pair_addresses.map( (pair: PairAddress) : Promise<FullPairResults> => rpcManager.getPairReserves(chainid, pair))
	)
    const timestamp = Date.now()

    const results: PairResponse[] = fprs.map( (pair) : PairResponse => {
        const switched = utils.getAddress(pair.asset) != utils.getAddress(pair.token0)
        return {
            chain_id: chainid,
            block_number: pair.block_number,
            timestamp,
            base_asset: pair.asset,
            quote_asset: pair.quote,
            bin_id: pair.bin,
            version: version == Version.V1 ? "v1" : version == Version.V2 ? "v2" : "v2.1",
            pair_address: pair.address,
            base_reserves: switched ? pair.reserve1 : pair.reserve0,
            quote_reserves: switched ? pair.reserve0 : pair.reserve1,
            price: switched ? pair.yToX : pair.price,
            inverse: switched ? pair.price : pair.yToX,
            err: pair.err
        }
    })
    rpcManager.printStats()
    return results;
}

const AVAX_V2_1_CREATION = 28388776
const ARB_V2_1_CREATION = 77609159
const ARB_V2_CREATION = 22442423
const BSC_V2_1_CREATION = 27459407

export const init = async () => {
    logger.info("INIT")
    // get all pair created events from factorys
    // v2.1 arbitrum
    let factory = new Contract(V2_1_FACTORY_ADDRESS, V2_1_FACTORY_ABI, MULTICALL_PROVIDERS[42161])
    let filter = factory.filters.LBPairCreated();
    let events = await factory.queryFilter(filter, ARB_V2_1_CREATION)
    let pairs = events.map ( e => { 
        return { token0: e.args?.tokenX, token1: e.args?.tokenY, bin: e.args?.binStep, addr: e.args?.LBPair}
    })
    console.table(pairs)
    RPC_MANAGERS[Version.V2_1].initPairs(42161, pairs)

    // v2 arb
    factory = new Contract(V2_FACTORY_ADDRESSES[42161], V2_FACTORY_ABI, MULTICALL_PROVIDERS[42161])
    filter = factory.filters.LBPairCreated();
    events = await factory.queryFilter(filter, ARB_V2_CREATION)
    pairs = events.map ( e => { 
        return { token0: e.args?.tokenX, token1: e.args?.tokenY, bin: e.args?.binStep, addr: e.args?.LBPair}
    })
    console.table(pairs)
    RPC_MANAGERS[Version.V2].initPairs(42161, pairs)

    // v1 arb
    factory = new Contract(V1_FACTORY_ADDRESSES[42161], V1_FACTORY_ABI, MULTICALL_PROVIDERS[42161])
    filter = factory.filters.PairCreated();
    events = await factory.queryFilter(filter, ARB_V2_CREATION)
    pairs = events.map ( e => { 
        return { token0: e.args?.token0, token1: e.args?.token1, bin: 0, addr: e.args?.pair}
    })
    console.table(pairs)
    RPC_MANAGERS[Version.V1].initPairs(42161, pairs)

    // get all bins for each pair

    // giant multicall to init all pairs
}