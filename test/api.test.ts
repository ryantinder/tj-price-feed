'use strict';

import { expect } from 'chai';
import { Version, fetchPrices } from '../src/common';
import { ARB_ARB, ARB_BTC_b, ARB_JOE, ARB_PAIRS, ARB_USDC, ARB_USDCe, ARB_USDT, ARB_WBTC, ARB_WETH, ARB_svBTC, AVAX_BTC_b, AVAX_PAIRS, AVAX_USDCe, AVAX_USDTe, AVAX_WBTC_e, BSC_BNB, BSC_BUSD, BSC_PAIRS, BSC_USDC, BSC_USDT } from '../src/lib/constants';
import { offchainPairResults } from './lib/pricing';
import { V2_1_ARB_WETH_PAIR, V2_1_BNB_USDT_PAIR, V2_1_BTC_WETH_PAIR, V2_1_USDT_USDC_PAIR, V2_1_USDT_USDC_PAIR_AVAX, V2_1_USDT_USDCe_PAIR, V2_1_WETH_JOE_PAIR, V2_1_WETH_USDC_PAIR, V2_1_WETH_USDT_PAIR, V2_1_svBTC_wBTC_PAIR } from './lib/constants';
import { higer, lower } from './lib/helpers';
import { Pair, PairResponse } from '../src/lib/interfaces';
import { logger, utils } from 'ethers';
import { app } from '../src';
import axios, { AxiosResponse } from 'axios';

const getPair = async (pair: Pair, offchain_addr: string, version: Version, chainid: number) => {
    // get our price
    let res = await axios.get(`http://127.0.0.1:3333/${chainid}/v1/prices/${[pair.asset]}/${pair.quote}`) 

    const pair_info = res.data as PairResponse
    // get tj price
    const [offchain_info] = await offchainPairResults([offchain_addr], chainid)
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
const postPairs = async (pairs: Pair[], offchain_addrs: string[], version: Version, chainid: number) => {
    // get our price
    let json = pairs.map( pair => {
        return {
            base: pair.asset,
            quote: pair.quote,
            bin: pair.bin
        }
    })

    let res = await axios.post(
        `http://127.0.0.1:3333/${chainid}/v2_1/batch-prices`,
        { pairs: json }
    )

    const pair_infos = res.data as PairResponse[]
    // get tj price
    const offchain_infos = await offchainPairResults(offchain_addrs, chainid)
    // compare the two
    const table: PairResponse[] = []
    for (let i = 0; i < pair_infos.length; i++) {
        const pair_info = pair_infos[i]
        const offchain_info = offchain_infos[i]
        table.push(pair_info)
        table.push(offchain_info)
        if (pair_info.err) logger.debug(pair_info.err)
        if (utils.getAddress(pair_info.base_asset) == utils.getAddress(offchain_info.base_asset)) {
            expect(pair_info.price).to.be.within(lower(offchain_info.price), higer(offchain_info.price))
            expect(pair_info.inverse).to.be.within(lower(offchain_info.inverse), higer(offchain_info.inverse))
        } else {
            expect(pair_info.price).to.be.within(lower(offchain_info.inverse), higer(offchain_info.inverse))
            expect(pair_info.inverse).to.be.within(lower(offchain_info.price), higer(offchain_info.price))
        }
    }
    console.table(table, ["base_asset", "quote_asset", "price", "inverse"])
}

describe('Api tests', () => {
    before(() => {
        app.listen(3333, () => {
            console.log("App listening on 3333")
        })
    })
    describe("Simple get tests", async () => {
        it("arbitrum (weth/usdc)", async () => {
            await getPair({ asset: ARB_WETH, quote: ARB_USDCe, bin: 0 }, V2_1_WETH_USDC_PAIR, Version.V1, 42161);
        }).timeout(50000)
        it("avax (wbtce/usdce)", async () => {
            await getPair({ asset: AVAX_USDTe, quote: AVAX_USDCe, bin: 0 }, V2_1_USDT_USDC_PAIR_AVAX, Version.V1, 43114);
        }).timeout(50000)
        it("bsc (bnb/busd)", async () => {
            await getPair({ asset: BSC_BNB, quote: BSC_BUSD, bin: 0 }, V2_1_BNB_USDT_PAIR, Version.V1, 56);
        }).timeout(50000)
    })
    describe("Simple post tests", async () => {
        it("arbitrum v2.1 (weth/joe) (weth/usdt) (weth/btc)", async () => {
            const pairs = [
                { asset: ARB_WETH, quote: ARB_JOE, bin: 20},
                { asset: ARB_WETH, quote: ARB_USDT, bin: 15},
                { asset: ARB_WETH, quote: ARB_BTC_b, bin: 10}
            ]
            const offchain_addrs = [
                V2_1_WETH_JOE_PAIR,
                V2_1_WETH_USDT_PAIR,
                V2_1_BTC_WETH_PAIR
            ]
            await postPairs(pairs, offchain_addrs, Version.V2_1, 42161);
        }).timeout(50000)
    })
});

