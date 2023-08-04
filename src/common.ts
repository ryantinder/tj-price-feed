import { utils } from "ethers";
import { FullPairResults, Pair, PairAddress, PairResponse } from "./lib/interfaces";
import { RPCManager } from "./RpcManager";
import { Version } from "./lib/constants";


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
        }
    })
    rpcManager.printStats()
    return results;
}