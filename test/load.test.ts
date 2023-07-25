'use strict';
import { plot } from 'asciichart'
import axios from 'axios';
import { ARB_JOE, ARB_WETH } from '../src/lib/constants';

describe('Load tests', async () => {
    it.only("10 conseq get requests", async () => {
        const pair = { asset: ARB_WETH, quote: ARB_JOE, bin: 20}
        const s0: number[] = []
        for (let i = 0; i < 10; i++) {
            let start = Date.now()
            const res = await axios.get(`http://localhost:3000/42161/v2_1/prices/${[pair.asset]}/${pair.quote}/${pair.bin}`) 
            let end = Date.now()
            s0.push(end - start)
        }
        console.log( plot(s0 , { height: 10}) )
    }).timeout(500000)
    it("10 simul get requests", async () => {
        console.log("test start")
        const pair = { asset: ARB_WETH, quote: ARB_JOE, bin: 20}
        // cache the pair
        const s0 = await Promise.all( Array(10).fill(0).map( async (_) : Promise<number> => {
            let start = Date.now()
            console.log("starting")
            await axios.get(`http://localhost:3000/42161/v2_1/prices/${[pair.asset]}/${pair.quote}/${pair.bin}`) 
            let end = Date.now()
            console.log(start, end)
            return end - start
        }))
        console.log(s0)
        console.log( plot(s0 , { height: 10}) )
    }).timeout(500000)
    // describe("Simple post tests", async () => {
    //     it("arbitrum v2.1 (weth/joe) (weth/usdt) (weth/btc)", async () => {
    //         const pairs = [
    //             { asset: ARB_WETH, quote: ARB_JOE, bin: 20},
    //             { asset: ARB_WETH, quote: ARB_USDT, bin: 15},
    //             { asset: ARB_WETH, quote: ARB_BTC_b, bin: 10}
    //         ]
    //         const offchain_addrs = [
    //             V2_1_WETH_JOE_PAIR,
    //             V2_1_WETH_USDT_PAIR,
    //             V2_1_BTC_WETH_PAIR
    //         ]
    //         await postPairs(pairs, offchain_addrs, Version.V2_1, 42161);
    //     }).timeout(50000)
    // })
});

