'use strict';

import { Logger } from 'sitka';
import { batchPriceV1 } from './v1';
import { batchPriceV2 } from './v2';
import { batchPriceV21 } from './v2_1';
import { AVAX_USDT, AVAX_WAVAX } from './lib/constants';
import express from "express"

const app = express()
const port = process.env.PORT || 3333;
app.use(express.json())
app.use(express.text({ type: "text/json" }));

const main = async () => {
    // @params
    const pricesv1 = await batchPriceV1([
        { asset: AVAX_WAVAX, quote: AVAX_USDT, bin: 0}, // 18 -> 18 a < q
        { asset: AVAX_USDT, quote: AVAX_WAVAX, bin: 0}, // 18 -> 18 a < q
    ])
    const pricesv2 = await batchPriceV2([
        { asset: AVAX_WAVAX, quote: AVAX_USDT, bin: 20},
        { asset: AVAX_USDT, quote: AVAX_WAVAX, bin: 20},
    ])
    const pricesv21 = await batchPriceV21([
        { asset: AVAX_WAVAX, quote: AVAX_USDT, bin: 20},
        { asset: AVAX_USDT, quote: AVAX_WAVAX, bin: 20},
    ])
    console.log("v1", pricesv1)
    console.log("v2", pricesv2)
    console.log("v21", pricesv21)
}

app.get("/tvl", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 0) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    
    return res.status(200).json(4);

});
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

