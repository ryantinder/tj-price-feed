import { utils } from "ethers";
import { FullPairResults, Pair, PairResponse } from "./lib/interfaces";
import { batchPriceV1 } from "./v1";
import { batchPriceV2 } from "./v2";
import { logger } from ".";
import { batchPriceV21 } from "./v2_1";

export enum Version {
    V1,
    V2,
    V2_1
}
export const fetchPrices = async (chain_id: number, pairs: Pair[], version: Version) : Promise<PairResponse[]> => {
    let fprs: FullPairResults[] = []
    let block_number = 0;
    const timestamp = Date.now()
    
    if (version == Version.V1) {
        const [_block_number, _fprs] = await batchPriceV1(
            chain_id,
            pairs
        )
        fprs = _fprs
        block_number = _block_number
    } else if (version == Version.V2) {
        const [_block_number, _fprs] = await batchPriceV2(
            chain_id,
            pairs
        )
        fprs = _fprs
        block_number = _block_number
    } else if (version == Version.V2_1) {
        const [_block_number, _fprs] = await batchPriceV21(
            chain_id,
            pairs
        )
        fprs = _fprs
        block_number = _block_number
    }
    const results: PairResponse[] = fprs.map( (pair) : PairResponse => {
        const switched = utils.getAddress(pair.asset) != utils.getAddress(pair.token0)
        logger.debug(`${switched} ${pair.price} ${pair.yToX}`)
        return {
            chain_id,
            block_number,
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
    return results;
}