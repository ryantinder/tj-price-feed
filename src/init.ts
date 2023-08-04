import { Contract } from "ethers"
import { MULTICALL_PROVIDERS, V2_1_FACTORY_ADDRESS } from "./lib/constants"
import { V2_1_FACTORY_ABI } from "./lib/abi"

export const init = async () => {
    // get all pair created events from factorys
    const factory = new Contract(V2_1_FACTORY_ADDRESS, V2_1_FACTORY_ABI, MULTICALL_PROVIDERS[42161])
    const filter = factory.filters.LBPairCreated();
    console.log(await factory.queryFilter(filter))
    // get all bins for each pair

    // giant multicall to init all pairs
}