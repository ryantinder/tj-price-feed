import { MulticallWrapper } from "ethers-multicall-provider";
import { Version } from "../common";
import { Cache } from "./cache";
import { TEN_POW, getDecimals, getPriceFromId, sortTokens, u128x128toDec } from "./helpers";
import { FullPairResults, Pair, PairAddress, Reserves } from "./interfaces";
import { BAD_PAIR, BAD_RESERVES, E18, PROBLEM_BTC_ETH_V2_1_POOL, PROBLEM_BTC_ETH_V2_POOL, PROVIDERS, V1_FACTORY_ADDRESSES, V2_1_FACTORY_ADDRESS, V2_FACTORY_ADDRESSES } from "./constants";
import { BigNumber, Contract, constants, utils } from "ethers";
import { V1_FACTORY_ABI, V1_PAIR_ABI, V2_1_FACTORY_ABI, V2_1_PAIR_ABI, V2_FACTORY_ABI, V2_PAIR } from "./abi";
import { ERROR_GET_RESERVES_FAILED, ERROR_PAIR_NOT_FOUND, ERROR_V2_PRICE_MATH_FAILED } from "./error";
import { logger } from "..";

export class RPCManager {
    private version: Version
    private cache: Cache
    private pair_rpc_calls = 0
    private reserves_rpc_calls = 0
    private pair_call_manager: {[t0t1bin: string] : {
        isFetching: boolean,
        promise: Promise<string>
    }}
    private reserves_call_manager: {[address: string] : {
        isFetching: boolean,
        promise: Promise<Reserves>
    }}

    constructor( _version: Version) {
        logger.info(`${_version} cache created`)
        this.version = _version
        this.cache = new Cache(_version)
        this.pair_call_manager = {}
        this.reserves_call_manager = {}
    }

    printStats() {
        logger.info(`${this.pair_rpc_calls} pair calls ${this.reserves_rpc_calls} reserves calls`)
    }

    async getPairAddress( chainid: number, pair: Pair ) : Promise<PairAddress> {
        logger.info("GETTING PAIR ADDRESS")
        const [token0, token1] = sortTokens(pair.asset, pair.quote)
        let address = constants.AddressZero;
        let err: string | undefined;
        const t0t1bin = `${token0}${token1}${pair.bin}`

        // if the rpc call is already out
        if (this.cache.hasPair(pair.bin, token0, token1)) {
            logger.info("PAIR CACHE HIT")
            address = this.cache.readPair(pair.bin, token0, token1)
        } else {
            logger.info("PAIR CACHE MISS")
            if (!this.pair_call_manager[t0t1bin] || !this.pair_call_manager[t0t1bin].isFetching) {
                let promise: Promise<string>
                if (this.version == Version.V1) {
                    promise = this._V1_PairAddr( chainid, pair, token0, token1)    
                } else if (this.version == Version.V2) {
                    promise = this._V2_PairAddr( chainid, pair, token0, token1)
                } else {
                    // same as v2
                    promise = this._V2_1_PairAddr( chainid, pair, token0, token1)
                }
                this.pair_call_manager[t0t1bin] = { isFetching: true, promise }
            }
            logger.info("WAITING ON PROMISE RESOLUTION")
            address = await this.pair_call_manager[t0t1bin].promise
            this.pair_call_manager[t0t1bin].isFetching = false
            if ( address == constants.AddressZero ) err = ERROR_PAIR_NOT_FOUND(this.version, pair)
        }
        return { ...pair, address, err }

    }

    async getPairReserves( chainid: number, pair: PairAddress) : Promise<FullPairResults> {
        logger.info("GETTING RESERVES")
        if (pair.err) return Promise.resolve({ ...BAD_PAIR, ...pair })
        const [token0, token1] = sortTokens(pair.asset, pair.quote)
        let err: string | undefined;
        let reserves: Reserves

        if (this.cache.hasReserves(pair.address) && this.cache.validReserves(pair.address)) {
            logger.info("RESERVES CACHE HIT")
            reserves = this.cache.readReserves(pair.address)
        } else {
            // reserves might not exist or might be outdated
            logger.info("RESERVES CACHE MISS")
            if (!this.reserves_call_manager[pair.address] || !this.reserves_call_manager[pair.address].isFetching) {
                let promise: Promise<Reserves>
                if (this.version == Version.V1) {
                    promise = this._V1_Reserves( chainid, pair)
                } else if (this.version == Version.V2) {
                    promise = this._V2_Reserves( chainid, pair)
                } else {
                    // same as v2
                    promise = this._V2_1_Reserves( chainid, pair)
                }
                this.reserves_call_manager[pair.address] = { isFetching: true, promise }
            }
            logger.info("WAITING ON PROMISE RESOLUTION")
            reserves = await this.reserves_call_manager[pair.address].promise
            this.reserves_call_manager[pair.address].isFetching = false
            logger.debug(reserves.err)
            if ( reserves.err ) return Promise.resolve({ ...BAD_PAIR, ...pair, err })
        }
        // at this point we should only have valid reserves
        if (this.version == Version.V1) {
            return this._V1_MATH( chainid, pair, reserves)
        } else if (this.version == Version.V2) {
            return this._V2_MATH( chainid, pair, reserves)
        } else {
            // same as v2
            return this._V2_MATH( chainid, pair, reserves)
        }
    }

    private async _V1_PairAddr( chainid: number, pair: Pair, token0: string, token1: string ) : Promise<string> {
        const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
        const V1_FACTORY = new Contract(V1_FACTORY_ADDRESSES[chainid], V1_FACTORY_ABI, multicall_provider);
        try {
            const pair_addr = await V1_FACTORY.getPair(token0, token1);
            if ( pair_addr != constants.AddressZero ) this.cache.setPair(pair.bin, token0, token1, utils.getAddress(pair_addr))
            return utils.getAddress(pair_addr)
        } catch (e) {
            logger.error(e)
            return constants.AddressZero
        }
    }
    private async _V2_1_PairAddr( chainid: number, pair: Pair, token0: string, token1: string ) : Promise<string> {
        const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
        const V2_1_FACTORY = new Contract(V2_1_FACTORY_ADDRESS, V2_1_FACTORY_ABI, multicall_provider);
        logger.info("RPC CALLING PAIR ADDRESS")
        this.pair_rpc_calls++;
        try {
            const [,pair_addr,,] = await V2_1_FACTORY.getLBPairInformation(token0, token1, pair.bin);
            if ( pair_addr != constants.AddressZero ) this.cache.setPair(pair.bin, token0, token1, utils.getAddress(pair_addr))
            return utils.getAddress(pair_addr)
        } catch (e) {
            logger.error(e)
            return constants.AddressZero
        }
    }
    private async _V2_PairAddr( chainid: number, pair: Pair, token0: string, token1: string ) : Promise<string> {
        const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
        const V2_FACTORY = new Contract(V2_FACTORY_ADDRESSES[chainid], V2_FACTORY_ABI, multicall_provider);
        logger.info("RPC CALLING PAIR ADDRESS")
        this.pair_rpc_calls++;
        try {
            const [,pair_addr,,] = await V2_FACTORY.getLBPairInformation(token0, token1, pair.bin);
            if ( pair_addr != constants.AddressZero ) this.cache.setPair(pair.bin, token0, token1, utils.getAddress(pair_addr))
            return utils.getAddress(pair_addr)
        } catch (e) {
            logger.error(e)
            return constants.AddressZero
        }
    }
    private async _V1_Reserves( chainid: number, pair: PairAddress) : Promise<Reserves> {
        const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
        const V1_PAIR = new Contract(constants.AddressZero, V1_PAIR_ABI, multicall_provider)
        const pair_contract = V1_PAIR.attach(pair.address)
        logger.info("RPC CALLING RESERVES")
        this.reserves_rpc_calls++;
        try {
            const [block_number, [reserves0, reserves1]] : [number, [BigNumber, BigNumber]] = 
                await Promise.all([
                    PROVIDERS[chainid].getBlockNumber(), 
                    pair_contract.getReserves()
                ])
            const timestamp = Date.now()
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            this.cache.setReserves(pair.address, timestamp, block_number, 0, reserves0, reserves1, token0, token1)
            return this.cache.readReserves(pair.address)
        } catch (e) {
            return { ...BAD_RESERVES, err: ERROR_GET_RESERVES_FAILED(this.version, pair.address)}
        }
    }
    private async _V2_1_Reserves( chainid: number, pair: PairAddress ) : Promise<Reserves> {
        const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
        const V2_1_PAIR = new Contract(constants.AddressZero, V2_1_PAIR_ABI, multicall_provider)
        const pair_contract = V2_1_PAIR.attach(pair.address)
        logger.info("RPC CALLING RESERVES")
        this.reserves_rpc_calls++;
        try {
            const [block_number, activeId, [reserves0, reserves1], token0, token1] : [number, number, [BigNumber, BigNumber], string, string] = 
                await Promise.all([
                    PROVIDERS[chainid].getBlockNumber(), 
                    pair_contract.getActiveId(), 
                    pair_contract.getReserves(), 
                    pair_contract.getTokenX(), 
                    pair_contract.getTokenY()
                ])
            const timestamp = Date.now()
            this.cache.setReserves(pair.address, timestamp, block_number, activeId, reserves0, reserves1, token0, token1)
            return this.cache.readReserves(pair.address)
        } catch (e) {
            return { ...BAD_RESERVES, err: ERROR_GET_RESERVES_FAILED(this.version, pair.address)}
        }
    }
    private async _V2_Reserves( chainid: number, pair: PairAddress ) : Promise<Reserves> {
        const multicall_provider = MulticallWrapper.wrap(PROVIDERS[chainid]);
        const pair_base = new Contract(constants.AddressZero, V2_PAIR, multicall_provider)
        const pair_contract = pair_base.attach(pair.address)
        logger.info("RPC CALLING RESERVES")
        this.reserves_rpc_calls++;
        try {
            const [block_number, [reserves0, reserves1, activeId], token0, token1] : [number, [BigNumber, BigNumber, number], string, string] = 
                await Promise.all([
                    PROVIDERS[chainid].getBlockNumber(), 
                    pair_contract.getReservesAndId(), 
                    pair_contract.tokenX(), 
                    pair_contract.tokenY()
                ])
            const timestamp = Date.now()
            this.cache.setReserves(pair.address, timestamp, block_number, activeId, reserves0, reserves1, token0, token1)
            return this.cache.readReserves(pair.address)
        } catch (e) {
            logger.debug(e)
            return { ...BAD_RESERVES, err: ERROR_GET_RESERVES_FAILED(this.version, pair.address)}
        }
    }

    private _V2_MATH = (chainid: number, pair: PairAddress, data: Reserves) : FullPairResults => {
        try {
            const [dec0, dec1] = [getDecimals(chainid, data.token0), getDecimals(chainid, data.token1)]
            const priceu128x128 = getPriceFromId(data.activeId, pair.bin)
            let price = 0;
            if (dec0 == dec1) {
                price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 18))
            } else if (dec0 == 8 || dec1 == 8) { // for 8 to 18
                price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 28))
            } else {
                price = parseFloat(utils.formatUnits(u128x128toDec(priceu128x128), 30))
            }
            
            if ([PROBLEM_BTC_ETH_V2_POOL, PROBLEM_BTC_ETH_V2_1_POOL].includes(utils.getAddress(pair.address))) price = 1 / price;
            return {
                ...pair,
                block_number: data.block_number,
                token0: data.token0,
                token1: data.token1,
                reserve0: parseFloat(utils.formatUnits(data.reserves0, dec0)), 
                reserve1: parseFloat(utils.formatUnits(data.reserves1, dec1)),
                yToX: price, 
                price: price != 0 ? 1 / price : 0,
            }
        } catch (e) {
            return {
                ...BAD_PAIR, ...pair, err: ERROR_V2_PRICE_MATH_FAILED(pair.address)
            }
        }
    }
    private _V1_MATH = (chainid: number, pair: PairAddress, data: Reserves) : FullPairResults => {
        const dec0 = getDecimals(chainid, data.token0)				
        const dec1 = getDecimals(chainid, data.token1)				
        const xToY = this._V1_calcXtoY(data.reserves0, data.reserves1, dec0, dec1)
        return {
            ...pair,
            ...data,
            reserve0: parseFloat(utils.formatUnits(data.reserves0, dec0)), 
            reserve1: parseFloat(utils.formatUnits(data.reserves1, dec1)),
            price: xToY,
            yToX: xToY != 0 ? 1 / xToY : 0
        }
    }
    private _V1_calcXtoY = (reserves0: BigNumber, reserves1: BigNumber, dec0: number, dec1: number) => {
        if (dec0 > dec1) {
            const diff = dec0 - dec1
            return parseFloat(utils.formatUnits(reserves1.mul( TEN_POW(diff)).mul(E18).div(reserves0), 18))
        } else {
            const diff = dec1 - dec0
            return parseFloat(utils.formatUnits(reserves1.mul(E18).div(reserves0.mul(TEN_POW(diff))), 18))
        }
    }
}