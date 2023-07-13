import axios from "axios"
import { TJPairInfo } from "./interfaces"
import { FullPairResults, PairResponse } from "../../src/lib/interfaces"
import { constants } from "ethers"

const chain_to_id: {[name: string] : number} = {
    "arbitrum" : 42161,
    "avalanche" : 43114,
    "bsc": 56
}

export const offchainPairResult = async (pair: string) : Promise<PairResponse> => {
    const res = (await axios.get(`https://barn.traderjoexyz.com/v1/pools/arbitrum/${pair}`)).data as TJPairInfo
    return {
        chain_id: chain_to_id[res.chain],
        block_number: 0,
        timestamp: 0,
        base_asset: res.tokenX.address,
        quote_asset: res.tokenY.address,
        bin_id: res.lbBinStep,
        pair_address: res.pairAddress,
        base_reserves: res.reserveX,
        quote_reserves: res.reserveY,
        version: res.version,
        price: res.tokenX.priceUsd / res.tokenY.priceUsd,
        inverse: res.tokenY.priceUsd / res.tokenX.priceUsd
    }
}