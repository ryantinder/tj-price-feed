import axios from "axios"
import { TJPairInfo } from "./interfaces"
import { FullPairResults, PairResponse } from "../../src/lib/interfaces"
import { constants } from "ethers"

const chain_to_id: {[name: string] : number} = {
    "arbitrum" : 42161,
    "avalanche" : 43114,
    "binance": 56
}
const id_to_chain: {[chainid: number] : string} = {
    42161: "arbitrum",
    43114: "avalanche",
    56 : "binance"
}

export const offchainPairResults = async (pairs: string[], chainid: number) : Promise<PairResponse[]> => {
    return await Promise.all( pairs.map( async (pair) : Promise<PairResponse> => {
        const res = (await axios.get(`https://barn.traderjoexyz.com/v1/pools/${id_to_chain[chainid]}/${pair}`)).data as TJPairInfo
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
    }))

}