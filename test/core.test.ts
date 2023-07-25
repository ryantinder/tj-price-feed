'use strict';

import { expect } from 'chai';
import { Version, fetchPrices } from '../src/common';
import { ARB_ARB, ARB_BTC_b, ARB_JOE, ARB_PAIRS, ARB_USDC, ARB_USDCe, ARB_USDT, ARB_WBTC, ARB_WETH, ARB_svBTC, AVAX_PAIRS, BSC_PAIRS } from '../src/lib/constants';
import { offchainPairResults } from './lib/pricing';
import { V2_1_ARB_WETH_PAIR, V2_1_BTC_WETH_PAIR, V2_1_USDT_USDC_PAIR, V2_1_USDT_USDCe_PAIR, V2_1_WETH_JOE_PAIR, V2_1_WETH_USDC_PAIR, V2_1_WETH_USDT_PAIR, V2_1_svBTC_wBTC_PAIR } from './lib/constants';
import { higer, lower } from './lib/helpers';
import { Pair } from '../src/lib/interfaces';
import { utils } from 'ethers';
import { logger } from '../src';

const checkPair = async (pair: Pair, offchain_addr: string, version: Version) => {
    // get our price
    const [pair_info] = await fetchPrices( 
        42161, 
        [pair],
        version
    )
    // get tj price
    const [offchain_info] = await offchainPairResults([offchain_addr], 42161)
    // compare the two
    console.table([
        pair_info,
        offchain_info
    ], ["base_asset", "quote_asset", "price", "inverse"])
    console.log(`Returned 1 = ${pair_info.price} quote`)
    if (pair_info.err) logger.debug(pair_info.err)
    if (utils.getAddress(pair_info.base_asset) == utils.getAddress(offchain_info.base_asset)) {
        expect(pair_info.price).to.be.within(lower(offchain_info.price), higer(offchain_info.price))
        expect(pair_info.inverse).to.be.within(lower(offchain_info.inverse), higer(offchain_info.inverse))
    } else {
        expect(pair_info.price).to.be.within(lower(offchain_info.inverse), higer(offchain_info.inverse))
        expect(pair_info.inverse).to.be.within(lower(offchain_info.price), higer(offchain_info.price))
    }
    return pair_info.price
}

describe('Core tests', () => {
    describe("v1 fetch pair data", async () => {
        it("18 -> 18 dec (weth/arb)", async () => {
            await checkPair( ARB_PAIRS[2], V2_1_ARB_WETH_PAIR, Version.V1)
        }).timeout(50000)
        it("18 -> 6 dec (weth/usdc)", async () => {
            await checkPair( ARB_PAIRS[0], V2_1_WETH_USDC_PAIR, Version.V1)
        }).timeout(50000)
        it("18 -> 8 dec (weth/btc)", async () => {
            await checkPair( ARB_PAIRS[1], V2_1_BTC_WETH_PAIR, Version.V1)
        }).timeout(50000)
        // no 6 to 6 v1 pool
        // no 6 to 8 v1 pool
        // this pool has low liquidity
        it("6 -> 18 dec (usdc/weth)", async () => {
            await checkPair( { asset: ARB_USDC, quote: ARB_WETH, bin: 0}, V2_1_WETH_USDC_PAIR, Version.V1)
        }).timeout(50000)
        // no btc pools on v1
    });
    describe("v2 fetch pair data", async () => {
        it("18 -> 18 dec (weth/arb)", async () => {
            await checkPair( { asset: ARB_WETH, quote: ARB_ARB, bin: 20}, V2_1_ARB_WETH_PAIR, Version.V2)
        }).timeout(50000)
        it("18 -> 6 dec (weth/usdc)", async () => {
            await checkPair( { asset: ARB_WETH, quote: ARB_USDCe, bin: 15}, V2_1_WETH_USDC_PAIR, Version.V2)
        }).timeout(50000)
        it("18 -> 8 dec (weth/btc)", async () => {
            await checkPair( { asset: ARB_WETH, quote: ARB_BTC_b, bin: 10}, V2_1_BTC_WETH_PAIR, Version.V2)
        }).timeout(50000)
        it("6 -> 6 dec (usdt/usdce)", async () => {
            await checkPair( { asset: ARB_USDT, quote: ARB_USDCe, bin: 1}, V2_1_USDT_USDCe_PAIR, Version.V2)
        }).timeout(50000)
        // no 6 to 8 v2 pool
        it("6 -> 18 dec (usdce/weth)", async () => {
            await checkPair( { asset: ARB_USDCe, quote: ARB_WETH, bin: 15}, V2_1_WETH_USDC_PAIR, Version.V2)
        }).timeout(50000)
        // no btc pools on v2
    });
    describe("v2.1 fetch pair data", async () => {
        it("18 -> 18 dec (weth/joe)", async () => {
            await checkPair( { asset: ARB_WETH, quote: ARB_JOE, bin: 20}, V2_1_WETH_JOE_PAIR, Version.V2_1)
        }).timeout(50000)
        it("18 -> 6 dec (weth/usdt)", async () => {
            await checkPair( { asset: ARB_WETH, quote: ARB_USDT, bin: 15}, V2_1_WETH_USDT_PAIR, Version.V2_1)
        }).timeout(50000)
        it("18 -> 8 dec (weth/btc)", async () => {
            await checkPair( { asset: ARB_WETH, quote: ARB_BTC_b, bin: 10}, V2_1_BTC_WETH_PAIR, Version.V2_1)
        }).timeout(50000)
        it("6 -> 6 dec (usdt/usdce)", async () => {
            await checkPair( { asset: ARB_USDT, quote: ARB_USDCe, bin: 1}, V2_1_USDT_USDCe_PAIR, Version.V2_1)
        }).timeout(50000)
        // no 6 to 8 v2.1 pool
        it("6 -> 18 dec (usdce/weth)", async () => {
            await checkPair( { asset: ARB_USDCe, quote: ARB_WETH, bin: 15}, V2_1_WETH_USDC_PAIR, Version.V2_1)
        }).timeout(50000)
        it("8 -> 18 dec (btc.b/weth)", async () => {
            await checkPair( { asset: ARB_BTC_b, quote: ARB_WETH, bin: 10}, V2_1_BTC_WETH_PAIR, Version.V2_1)
        }).timeout(50000)
        // no 8 to 6 v2.1 pool
        it("8 -> 8 dec (svbtc/wbtc)", async () => {
            await checkPair( { asset: ARB_svBTC, quote: ARB_WBTC, bin: 5}, V2_1_svBTC_wBTC_PAIR, Version.V2_1)
        }).timeout(50000)
        // no btc pools on v2
    });
});

