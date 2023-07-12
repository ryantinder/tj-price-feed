'use strict';

import { expect } from 'chai';
import { batchPriceV1 } from '../src/v1';
import { ARB_PAIRS, AVAX_PAIRS, BSC_PAIRS } from '../src/lib/constants';
// describe('Units', () => {
//     describe("v1", async () => {
//         // describe("simple fetch", async () => {
//         //     it('arb simple fetch', async () => {
//         //         const prices = await batchPriceV1(42161, [
//         //             ARB_PAIRS[0]
//         //         ])
//         //         expect(prices[0]).to.exist
//         //     }).timeout(5000);
//         //     it('avax simple fetch', async () => {
//         //         const prices = await batchPriceV1(43114, [
//         //             AVAX_PAIRS[0]
//         //         ])
//         //         expect(prices[0]).to.exist
//         //     }).timeout(5000);
//         //     it('bsc simple fetch', async () => {
//         //         const prices = await batchPriceV1(56, [
//         //             BSC_PAIRS[0]
//         //         ])
//         //         expect(prices[0]).to.exist
//         //     }).timeout(5000);
//         // })
//         // describe("batch fetch", async () => {
//         //     it('arb batch fetch', async () => {
//         //         const prices = await batchPriceV1(42161, [
//         //             ...ARB_PAIRS
//         //         ])
//         //         expect(prices[0]).to.exist
//         //     }).timeout(5000);
//         //     it('avax batch fetch', async () => {
//         //         const prices = await batchPriceV1(43114, [
//         //             ...AVAX_PAIRS
//         //         ])
//         //         expect(prices[0]).to.exist
//         //     }).timeout(5000);
//         //     it('bsc batch fetch', async () => {
//         //         const prices = await batchPriceV1(56, [
//         //             ...BSC_PAIRS
//         //         ])
//         //         expect(prices[0]).to.exist
//         //     }).timeout(5000);
//         // })
//         it("cached fetch", async () => {
//             const prices = await batchPriceV1(42161, [
//                 ARB_PAIRS[0]
//             ])
//             const _ = await batchPriceV1(42161, [
//                 ARB_PAIRS[0]
//             ])
//             expect(prices).to.eq(_)
//         }).timeout(5000)
//     });
// });
const main = async () => {
    const prices = await batchPriceV1(42161, [
        ARB_PAIRS[0]
    ])
    const _ = await batchPriceV1(42161, [
        ARB_PAIRS[0]
    ])
}
main().then()

