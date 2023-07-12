import { constants, providers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { FullPairResults } from './interfaces'

export const CHAIN_IDS = [43114, 42161, 56]

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
export const V1_FACTORY_ADDRESSES: {[chainid: number] : string} = {
	43114: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
	42161: '0xaE4EC9901c3076D0DdBe76A520F9E90a6227aCB7',
	56: '0x4f8bdc85E3eec5b9dE67097c3f59B6Db025d9986'
}
export const V2_FACTORY_ADDRESSES: {[chainid: number] : string} = {
	43114: '0x6E77932A92582f504FF6c4BdbCef7Da6c198aEEf',
	42161: '0x1886D09C9Ade0c5DB822D85D21678Db67B6c2982',
	56: '0x43646A8e839B2f2766392C1BF8f60F6e587B6960'
}
export const V2_1_FACTORY_ADDRESS = '0x8e42f2F4101563bF679975178e880FD87d3eFd4e'

export const BAD_PAIR: FullPairResults = {
	address: constants.AddressZero,
	asset: constants.AddressZero,
	quote: constants.AddressZero,
	bin: -1,
	price: -1,
	reserve0: -1,
	reserve1: -1,
	yToX: -1
}