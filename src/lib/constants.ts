import { BigNumber, constants, providers, utils } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { FullPairResults, Pair, Reserves } from './interfaces'
import { MulticallWrapper } from 'ethers-multicall-provider'

export const CHAIN_IDS = [43114, 42161, 56]

export const ARB_WETH = getAddress('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1')
export const ARB_ARB = getAddress('0x912ce59144191c1204e64559fe8253a0e49e6548')
export const ARB_JOE = getAddress('0x371c7ec6d8039ff7933a2aa28eb827ffe1f52f07')

export const ARB_BTC_b = getAddress('0x2297aebd383787a160dd0d9f71508148769342e3')
export const ARB_WBTC = getAddress('0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f')
export const ARB_svBTC = getAddress('0xeee18334c414a47fb886a7317e1885b2bfb8c2a6')

export const ARB_USDCe = getAddress('0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8')
export const ARB_USDC = getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831')
export const ARB_USDT = getAddress('0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9')

export const ARB_PAIRS: Pair[] = [
	{ asset: ARB_WETH, quote: ARB_USDCe, bin: 15},
	{ asset: ARB_WETH, quote: ARB_BTC_b, bin: 10},
	{ asset: ARB_WETH, quote: ARB_ARB, bin: 20},
	{ asset: ARB_USDT, quote: ARB_USDC, bin: 1}
]

export const AVAX_WAVAX = getAddress('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7')
export const AVAX_JOE = getAddress('0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd')
export const AVAX_USDC = getAddress('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E')
export const AVAX_USDCe = getAddress('0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664')
export const AVAX_USDT = getAddress('0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7')
export const AVAX_USDTe = getAddress('0xc7198437980c041c805a1edcba50c1ce5db95118')
export const AVAX_DAIe = getAddress('0xd586E7F844cEa2F87f50152665BCbc2C279D8d70')
export const AVAX_BTC_b = getAddress('0x152b9d0fdc40c096757f570a51e494bd4b943e50')
export const AVAX_WBTC_e = getAddress('0x50b7545627a5162f82a992c33b87adc75187b218')

export const AVAX_PAIRS: Pair[] = [
	{ asset: AVAX_BTC_b, quote: AVAX_USDC, bin: 10},
	{ asset: AVAX_WAVAX, quote: AVAX_USDC, bin: 20},
	{ asset: AVAX_USDT, quote: AVAX_USDC, bin: 1},
	{ asset: AVAX_USDTe, quote: AVAX_USDC, bin: 1}
]

export const BSC_BNB = getAddress('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c')
export const BSC_LVL = getAddress('0xb64e280e9d1b5dbec4accedb2257a87b400db149')
export const BSC_BUSD = getAddress('0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56')
export const BSC_FIL = getAddress('0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153')

export const BSC_USDC = getAddress('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d')
export const BSC_USDT = getAddress('0x55d398326f99059ff775485246999027b3197955')

export const BSC_BTCB = getAddress('0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c')
export const BSC_BTC_B =  getAddress('0x2297aebd383787a160dd0d9f71508148769342e3')

export const BSC_PAIRS: Pair[] = [
	{ asset: BSC_BNB, quote: BSC_USDT, bin: 15},
	{ asset: BSC_BTCB, quote: BSC_BNB, bin: 10},
	{ asset: BSC_BTC_B, quote: BSC_BNB, bin: 25},
	{ asset: BSC_LVL, quote: BSC_USDT, bin: 25},
	{ asset: BSC_FIL, quote: BSC_BNB, bin: 25},
	{ asset: BSC_USDC, quote: BSC_USDT, bin: 1}
]

export const E18 = constants.WeiPerEther;

export const E6_ADDRESSES: {[chainid: number] : string[]} = {
	43114: [AVAX_USDC, AVAX_USDCe, AVAX_USDT, AVAX_USDTe],
    42161: [ARB_USDCe, ARB_USDC, ARB_USDT],
    56: [BSC_USDC, BSC_USDT]
}
export const E8_ADDRESSES: {[chainid: number] : string[]} = {
	43114: [AVAX_BTC_b, AVAX_WBTC_e],
    42161: [ARB_BTC_b, ARB_WBTC],
    56: [BSC_BTCB, BSC_BTC_B]
}
export const PROVIDERS: {[chainid: number] : providers.JsonRpcProvider } = {
	43114: new providers.JsonRpcProvider(process.env.AVALANCHE!),
	42161: new providers.JsonRpcProvider(process.env.ARBITRUM!),
	56: new providers.JsonRpcProvider(process.env.BSC!)
}
export const MULTICALL_PROVIDERS: {[chainid: number] : providers.JsonRpcProvider } = {
	43114: MulticallWrapper.wrap(PROVIDERS[43114]),
	42161: MulticallWrapper.wrap(PROVIDERS[42161]),
	56: MulticallWrapper.wrap(PROVIDERS[56])
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
export const BTC_PRICE = 30000
export const ETH_PRICE = 1800
export const BTC_ADDRESSES = [ARB_BTC_b, ARB_WBTC, ARB_svBTC, AVAX_BTC_b, AVAX_WBTC_e, BSC_BTCB, BSC_BTC_B]
export const PROBLEM_BTC_ETH_V2_POOL = utils.getAddress("0x22300140ab7F5e20D48c2E4d826bd95a13458Baa")
export const PROBLEM_BTC_ETH_V2_1_POOL = utils.getAddress("0xdf34e7548af638cc37b8923ef1139ea98644735a")
export const BAD_PAIR: FullPairResults = {
	address: constants.AddressZero,
	asset: constants.AddressZero,
	quote: constants.AddressZero,
    token0: constants.AddressZero,
    token1: constants.AddressZero,
    block_number: 0,
	bin: -1,
	price: -1,
	reserve0: -1,
	reserve1: -1,
	yToX: -1
}
export const BAD_RESERVES: Reserves = {
    activeId: -1,
    block_number: -1,
    reserves0: BigNumber.from(0),
    reserves1: BigNumber.from(0),
    timestamp: -1,
    token0: "",
    token1: "",
    localLiquidityX: BigNumber.from(0),
    localLiquidityY: BigNumber.from(0)
}



export enum Version {
    V1,
    V2,
    V2_1
}