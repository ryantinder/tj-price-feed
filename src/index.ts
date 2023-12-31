'use strict';

import { CHAIN_IDS, Version} from './lib/constants';
import express from 'express'
import { utils } from 'ethers';
import { Logger } from 'sitka';
import { fetchPrices } from './common';
import { Pair } from './lib/interfaces';
import { init } from './common';

export const logger = Logger.getLogger();

export const app = express()
const port = process.env.PORT || 3333;

/**
 * @author 0xTinder
 * Entry point for API calls
 * This file will handle GET and POST requests, as well as set up the express server
 */

/*/////////////////////////////////////////////
                    GET
/////////////////////////////////////////////*/
app.get('/:chainid/v1/prices/:base/:quote', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	// parse inputs
	if (!utils.isAddress(req.params.base)) return res.status(400).json({'ERR' : `Invalid base asset: ${req.params.base}`})
	if (!utils.isAddress(req.params.quote)) return res.status(400).json({'ERR' : `Invalid quote asset: ${req.params.quote}`})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const base = utils.getAddress(req.params.base)
	const quote = utils.getAddress(req.params.quote)
	const chainId = parseInt(req.params.chainid)
    const pair: Pair = { asset: base, quote, bin: 0};
    const data = await fetchPrices(chainId, [pair], Version.V1)

    if (!data || !data[0]) return res.status(400).json("Error occurred while fetching");
	return res.status(200).json(data[0]);
});
app.get('/:chainid/v2/prices/:base/:quote/:bin', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!utils.isAddress(req.params.base)) return res.status(400).json({'ERR' : `Invalid base asset: ${req.params.base}`})
	if (!utils.isAddress(req.params.quote)) return res.status(400).json({'ERR' : `Invalid quote asset: ${req.params.quote}`})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const base = utils.getAddress(req.params.base)
	const quote = utils.getAddress(req.params.quote)
	const chainId = parseInt(req.params.chainid)
	const bin = parseInt(req.params.bin)
    const pair: Pair = { asset: base, quote, bin};
    const data = await fetchPrices(chainId, [pair], Version.V2)

    if (!data || !data[0]) return res.status(400).json("Error occurred while fetching");
	return res.status(200).json(data[0]);
});
app.get('/:chainid/v2_1/prices/:base/:quote/:bin', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!utils.isAddress(req.params.base)) return res.status(400).json({'ERR' : `Invalid base asset: ${req.params.base}`})
	if (!utils.isAddress(req.params.quote)) return res.status(400).json({'ERR' : `Invalid quote asset: ${req.params.quote}`})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const base = utils.getAddress(req.params.base)
	const quote = utils.getAddress(req.params.quote)
	const chainId = parseInt(req.params.chainid)
	const bin = parseInt(req.params.bin)
    const pair: Pair = { asset: base, quote, bin};
    const data = await fetchPrices(chainId, [pair], Version.V2_1)

    if (!data || !data[0]) return res.status(400).json("Error occurred while fetching");
	return res.status(200).json(data[0]);
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
    const _pairs= pairs.map( p => { return { asset: utils.getAddress(p.base), quote: utils.getAddress(p.quote), bin: 0}})
    const data = await fetchPrices(chainId, _pairs, Version.V1)

    if (!data) return res.status(400).json("Error occurred while fetching");
	return res.status(200).json(data);
});
app.post('/:chainid/v2/batch-prices', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const pairs = req.body.pairs as {base: string, quote: string, bin: number}[]
    
	const chainId = parseInt(req.params.chainid)
    const _pairs= pairs.map( p => { return { asset: utils.getAddress(p.base), quote: utils.getAddress(p.quote), bin: p.bin}})
    const data = await fetchPrices(chainId, _pairs, Version.V2)

    if (!data) return res.status(400).json("Error occurred while fetching");
	return res.status(200).json(data);
});
app.post('/:chainid/v2_1/batch-prices', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// should only two params
	// if (Object.keys(req.params).length != 3) return res.status(400).json({"ERR" : "Invalid num of parameters"})
	if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({'ERR' : 'Unsupported chain id'})
	const pairs = req.body.pairs as {base: string, quote: string, bin: number}[]
    
	const chainId = parseInt(req.params.chainid)
    const _pairs= pairs.map( p => { return { asset: utils.getAddress(p.base), quote: utils.getAddress(p.quote), bin: p.bin}})
    const data = await fetchPrices(chainId, _pairs, Version.V2_1)

    if (!data) return res.status(400).json("Error occurred while fetching");
	return res.status(200).json(data);
});
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
    init()
});
