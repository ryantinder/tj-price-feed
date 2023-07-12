'use strict';

import { batchPriceV1 } from './v1';
import { batchPriceV2 } from './v2';
import { batchPriceV21 } from './v2_1';
import { CHAIN_IDS } from './lib/constants';
import express from 'express'
import { utils } from 'ethers';
import { fmtBatchResponse, fmtSingleResponse } from './lib/helpers';
import bodyParser from 'body-parser';
import { Logger } from 'sitka';

export const logger = Logger.getLogger();

export const app = express()
const port = process.env.PORT || 3333;
app.use(express.json())
app.use(bodyParser.json())
app.use(express.text({ type: 'text/json' }));
app.use(bodyParser.urlencoded({ extended: false }))

/*/////////////////////////////////////////////
                    GET
/////////////////////////////////////////////*/
app.get('/:chainid/v1/prices/:base/:quote', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!utils.isAddress(req.params.base)) return res.status(400).json({'ERR' : `Invalid base asset: ${req.params.base}`})
	if (!utils.isAddress(req.params.quote)) return res.status(400).json({'ERR' : `Invalid quote asset: ${req.params.quote}`})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const base = req.params.base
	const quote = req.params.quote
	const chainId = parseInt(req.params.chainid)
	const [block_number, prices] = await batchPriceV1(
		chainId,
		[{asset: base, quote, bin: 0}]
	)
    
	if (!prices[0] || prices[0].err) {
		return res.status(400).json(fmtSingleResponse(block_number, chainId, prices[0]));
	}
	return res.status(200).json(fmtSingleResponse(block_number, chainId, prices[0]));
});
app.get('/:chainid/v2/prices/:base/:quote/:bin', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!utils.isAddress(req.params.base)) return res.status(400).json({'ERR' : `Invalid base asset: ${req.params.base}`})
	if (!utils.isAddress(req.params.quote)) return res.status(400).json({'ERR' : `Invalid quote asset: ${req.params.quote}`})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const base = req.params.base
	const quote = req.params.quote
	const chainId = parseInt(req.params.chainid)
	const bin = parseInt(req.params.bin)
	const [block_number, prices] = await batchPriceV2(
		chainId,
		[{asset: base, quote, bin}]
	)
    
	if (!prices[0] || prices[0].err) {
		return res.status(400).json(fmtSingleResponse(block_number, chainId, prices[0]));
	}
	return res.status(200).json(fmtSingleResponse(block_number, chainId, prices[0]));
});
app.get('/:chainid/v2_1/prices/:base/:quote/:bin', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!utils.isAddress(req.params.base)) return res.status(400).json({'ERR' : `Invalid base asset: ${req.params.base}`})
	if (!utils.isAddress(req.params.quote)) return res.status(400).json({'ERR' : `Invalid quote asset: ${req.params.quote}`})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const base = req.params.base
	const quote = req.params.quote
	const chainId = parseInt(req.params.chainid)
	const bin = parseInt(req.params.bin)
	const [block_number, prices] = await batchPriceV21(
		chainId,
		[{asset: base, quote, bin}]
	)
    
	if (!prices[0] || prices[0].err ) {
		return res.status(400).json(prices[0])
	}
	return res.status(200).json(fmtSingleResponse(block_number, chainId, prices[0]));
});
/*/////////////////////////////////////////////
                    POST
/////////////////////////////////////////////*/
app.post('/:chainid/v1/batch-prices', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const pairs = req.body.pairs as {base: string, quote: string}[]
    
	const chainId = parseInt(req.params.chainid)
	console.log(pairs)
	const [block_number, prices] = await batchPriceV1(
		chainId,
		pairs.map( p => { return { ...p, asset: p.base, bin: 0}})
	)
    
	if (!prices) {
		return res.status(400).json(fmtBatchResponse(block_number, chainId, prices));
	}
	return res.status(200).json(fmtBatchResponse(block_number, chainId, prices));
});
app.post('/:chainid/v2/batch-prices', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const pairs = req.body.pairs as {base: string, quote: string, bin: number}[]
    
	const chainId = parseInt(req.params.chainid)
	console.log(pairs)
	const [block_number, prices] = await batchPriceV2(
		chainId,
		pairs.map( p => { return { ...p, asset: p.base, bin: p.bin}})
	)
    
	if (!prices) {
		return res.status(400).json(fmtBatchResponse(block_number, chainId, prices));
	}
	return res.status(200).json(fmtBatchResponse(block_number, chainId, prices));
});
app.post('/:chainid/v2_1/batch-prices', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const pairs = req.body.pairs as {base: string, quote: string, bin: number}[]
    
	const chainId = parseInt(req.params.chainid)
	console.log(pairs)
	const [block_number, prices] = await batchPriceV1(
		chainId,
		pairs.map( p => { return { ...p, asset: p.base, bin: p.bin}})
	)
    
	if (!prices) {
		return res.status(400).json(fmtBatchResponse(block_number, chainId, prices));
	}
	return res.status(200).json(fmtBatchResponse(block_number, chainId, prices));
});
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
