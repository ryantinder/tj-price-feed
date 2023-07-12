import { constants, providers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'

export const AVALANCHE_CHAIN_ID = 43114

export const ARB_WETH = getAddress('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1')
export const ARB_USDC = getAddress('0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8')
export const AVAX_WAVAX = getAddress('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7')
export const AVAX_JOE = getAddress('0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd')
export const AVAX_USDC = getAddress('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E')
export const AVAX_USDT = getAddress('0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7')
export const AVAX_DAIe = getAddress('0xd586E7F844cEa2F87f50152665BCbc2C279D8d70')
export const AVAX_BTC = getAddress('0x152b9d0FdC40C096757F570A51E494bd4b943E50')

export const E18 = constants.WeiPerEther;

export const E6_ADDRESSES: {[chainid: number] : string[]} = {
	43114: [AVAX_USDC, AVAX_USDT]
}
export const E8_ADDRESSES: {[chainid: number] : string[]} = {
	43114: [AVAX_BTC]
}

export const PROVIDERS: {[chainid: number] : providers.JsonRpcProvider } = {
	43114: new providers.JsonRpcProvider(process.env.AVALANCHE!)
}