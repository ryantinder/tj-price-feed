import { Cache } from "./lib/cache";
import { TEN_POW, getDecimals, getPriceFromId, sortTokens, u128x128toDec } from "./lib/helpers";
import { FullPairResults, Pair, PairAddress, Reserves } from "./lib/interfaces";
import { ARB_WETH, BAD_PAIR, BAD_RESERVES, E18, MULTICALL_PROVIDERS, PROBLEM_BTC_ETH_V2_1_POOL, PROBLEM_BTC_ETH_V2_POOL, PROVIDERS, V1_FACTORY_ADDRESSES, V2_1_FACTORY_ADDRESS, V2_FACTORY_ADDRESSES, Version } from "./lib/constants";
import { BigNumber, Contract, constants, ethers, logger, utils } from "ethers";
import { V1_FACTORY_ABI, V1_PAIR_ABI, V2_1_FACTORY_ABI, V2_1_PAIR_ABI, V2_FACTORY_ABI, V2_PAIR } from "./lib/abi";
import { ERROR_GET_RESERVES_FAILED, ERROR_PAIR_NOT_FOUND, ERROR_V2_PRICE_MATH_FAILED } from "./lib/error";

/**
 * @class RPCManager
 * @description Class provides caching and request deduplication for RPC calls,
 *              primary logic class for price math as well.
 */
export class RPCManager {
    // The version of TraderJoe contracts managed
    private version: Version
    // Caching
    private cache: Cache
    // Variables for tracking caching performance
    private pair_rpc_calls = 0
    private reserves_rpc_calls = 0
    // Variables for request deduplication
    private pair_call_manager: {[t0t1bin: string] : {
        isFetching: boolean,
        promise: Promise<string>
    }}
    private reserves_call_manager: {[address: string] : {
        isFetching: boolean,
        promise: Promise<Reserves>
    }}

    constructor( _version: Version) {
        console.log(`${_version} cache created`)
        this.version = _version
        this.cache = new Cache(_version)
        this.pair_call_manager = {}
        this.reserves_call_manager = {}
    }

    printStats() {
        console.log(`${this.pair_rpc_calls} pair calls ${this.reserves_rpc_calls} reserves calls`)
    }

    /**
     * @member initPairs
     * @param chainid 
     * @param pairs 
     * @description Function intended to be called from init script in src/common.ts,
     * caches all pair addresses and last_bin for low liquidity warnings
     */
    async initPairs(chainid: number, pairs: {token0: string, token1: string, bin: number, addr: string}[]) {
        console.log(`Initializing chainid ${chainid}, version ${this.version}, ${pairs.length} pairs`)
        pairs.map(pair => this.cache.setPair(pair.bin, pair.token0, pair.token1, pair.addr))
        if (this.version == Version.V1) {
            pairs.map(pair => this.cache.setBin(0, pair.addr))
        }
        else if (this.version == Version.V2) {
            const factory = new Contract(constants.AddressZero, V2_PAIR, MULTICALL_PROVIDERS[chainid]);
            await Promise.all(
                pairs.map( pair => {
                    return factory.attach(pair.addr).getReservesAndId().then( ([,, activeId]: [never, never, number]) => {
                        this.cache.setBin(activeId, pair.addr)
                    })
                })
            )
        }
        else if (this.version == Version.V2_1) {
            const factory = new Contract(constants.AddressZero, V2_1_PAIR_ABI, MULTICALL_PROVIDERS[chainid]);
            await Promise.all(
                pairs.map( pair => {
                    return factory.attach(pair.addr).getActiveId().then( (activeId: number) => {
                        this.cache.setBin(activeId, pair.addr)
                    })
                })
            )      
        }
    }

    /**
     * @member getPairAddress
     * @param chainid 
     * @param pair address
     * @returns PairAddress object, which just extends a `pair` with its address
     */
    async getPairAddress( chainid: number, pair: Pair ) : Promise<PairAddress> {
        // sort tokens
        const [token0, token1] = sortTokens(pair.asset, pair.quote)
        let address = constants.AddressZero;
        let err: string | undefined;
        // deduplication key concatenates pair tokens and bin to be unique
        const t0t1bin = `${token0}${token1}${pair.bin}`

        // first check cache for pair address
        if (this.cache.hasPair(pair.bin, token0, token1)) {
            // console.log("PAIR CACHE HIT")
            address = this.cache.readPair(pair.bin, token0, token1)
        } else {
            // console.log("PAIR CACHE MISS, NEED TO INIT PAIR")
            // pair might not exist or might be already being fetched
            if (!this.pair_call_manager[t0t1bin] || !this.pair_call_manager[t0t1bin].isFetching) {
                let promise: Promise<string>
                if (this.version == Version.V1) {
                    promise = this._V1_PairAddr( chainid, token0, token1)    
                } else if (this.version == Version.V2) {
                    promise = this._V2_PairAddr( chainid, pair.bin, token0, token1)
                } else {
                    // same as v2
                    promise = this._V2_1_PairAddr( chainid, pair.bin, token0, token1)
                }
                this.pair_call_manager[t0t1bin] = { isFetching: true, promise }
            }
            // console.log("WAITING ON PROMISE RESOLUTION")
            // For simulantous requests, only one will be fetching, the rest will wait on the promise
            address = await this.pair_call_manager[t0t1bin].promise
            this.pair_call_manager[t0t1bin].isFetching = false
            if ( address == constants.AddressZero ) err = ERROR_PAIR_NOT_FOUND(this.version, pair)
        }
        return { ...pair, address, err }

    }
    /**
     * @member getPairReserves
     * @param chainid 
     * @param pair PairAddress object
     * @returns FullPairResult
     * @description 2nd step of fetching price. Handles caching for RPC calling reserves
     */
    async getPairReserves( chainid: number, pair: PairAddress) : Promise<FullPairResults> {
        // console.log("GETTING RESERVES")
        // we can skip the rpc call if the pair has already errored in a previous step
        if (pair.err) return Promise.resolve({ ...BAD_PAIR, ...pair })
        let err: string | undefined;
        let reserves: Reserves

        // first check cache for reserves
        if (this.cache.hasReserves(pair.address) && this.cache.validReserves(pair.address)) {
            // console.log("RESERVES CACHE HIT")
            reserves = this.cache.readReserves(pair.address)
        } else {
            // reserves might not exist or might be already being fetched
            // console.log("RESERVES CACHE MISS")
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
            // console.log("WAITING ON PROMISE RESOLUTION")
            // For simulantous requests, only one will be fetching, the rest will wait on the promise
            reserves = await this.reserves_call_manager[pair.address].promise
            this.reserves_call_manager[pair.address].isFetching = false
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
    /**
     * @member _V1_PairAddr
     * @param chainid 
     * @param token0 
     * @param token1 
     * @returns pair address
     * @description contract call pair address for V1
     */
    private async _V1_PairAddr( chainid: number, token0: string, token1: string ) : Promise<string> {
        const V1_FACTORY = new Contract(V1_FACTORY_ADDRESSES[chainid], V1_FACTORY_ABI, MULTICALL_PROVIDERS[chainid]);
        try {
            const pair_addr = await V1_FACTORY.getPair(token0, token1);
            if ( pair_addr != constants.AddressZero ) {
                this.cache.setPair(0, token0, token1, utils.getAddress(pair_addr))
                return this.cache.readPair(0, token0, token1)
            }
            return constants.AddressZero;
        } catch (e) {
            console.log(e)
            return constants.AddressZero
        }
    }
    /**
     * @member _V2_1_PairAddr
     * @param chainid 
     * @param bin 
     * @param token0 
     * @param token1 
     * @returns contract call pair address for V2.1
     */
    private async _V2_1_PairAddr( chainid: number, bin: number, token0: string, token1: string ) : Promise<string> {
        const V2_1_FACTORY = new Contract(V2_1_FACTORY_ADDRESS, V2_1_FACTORY_ABI, MULTICALL_PROVIDERS[chainid]);
        console.log("RPC CALLING PAIR ADDRESS")
        this.pair_rpc_calls++;
        try {
            const [,_pair_addr,,] = await V2_1_FACTORY.getLBPairInformation(token0, token1, bin);
            const pair_addr = utils.getAddress(_pair_addr)
            console.log(pair_addr)
            if ( pair_addr != constants.AddressZero ) {
                const PAIR_CONTRACT = new Contract(pair_addr, V2_1_PAIR_ABI, MULTICALL_PROVIDERS[chainid]);
                const activeId: number = await PAIR_CONTRACT.getActiveId();
                this.cache.setPair(bin, token0, token1, pair_addr)
                this.cache.setBin(activeId, pair_addr);
                return this.cache.readPair(bin, token0, token1)
            }
            return constants.AddressZero
        } catch (e) {
            console.log(e)
            return constants.AddressZero
        }
    }
    /**
     * @member _V2_PairAddr
     * @param chainid 
     * @param bin 
     * @param token0 
     * @param token1 
     * @returns contract call pair address for V2
     */
    private async _V2_PairAddr( chainid: number, bin: number, token0: string, token1: string ) : Promise<string> {
        const V2_FACTORY = new Contract(V2_FACTORY_ADDRESSES[chainid], V2_FACTORY_ABI, MULTICALL_PROVIDERS[chainid]);
        console.log("RPC CALLING PAIR ADDRESS")
        this.pair_rpc_calls++;
        try {
            const [,_pair_addr,,] = await V2_FACTORY.getLBPairInformation(token0, token1, bin);
            const pair_addr = utils.getAddress(_pair_addr)
            if ( pair_addr != constants.AddressZero ) {
                const PAIR_CONTRACT = new Contract(pair_addr, V2_PAIR, MULTICALL_PROVIDERS[chainid])
                const [,,activeId] = await PAIR_CONTRACT.getReservesAndId()
                this.cache.setBin(activeId, pair_addr)
                this.cache.setPair(bin, token0, token1, pair_addr)
                return this.cache.readPair(bin, token0, token1)
            }
            return constants.AddressZero
        } catch (e) {
            console.log(e)
            return constants.AddressZero
        }
    }
    /**
     * @member _V1_Reserves
     * @param chainid 
     * @param pair 
     * @returns contract call reserves for V1
     */
    private async _V1_Reserves( chainid: number, pair: PairAddress) : Promise<Reserves> {
        const pair_contract = new Contract(pair.address, V1_PAIR_ABI, MULTICALL_PROVIDERS[chainid])
        console.log("RPC CALLING RESERVES")
        this.reserves_rpc_calls++;
        try {
            const [block_number, [reserves0, reserves1]] : [number, [BigNumber, BigNumber]] = 
                await Promise.all([
                    PROVIDERS[chainid].getBlockNumber(), 
                    pair_contract.getReserves()
                ])
            const timestamp = Date.now()
            const [token0, token1] = sortTokens(pair.asset, pair.quote)
            this.cache.setReserves(pair.address, timestamp, block_number, 0, reserves0, reserves1, token0, token1, reserves0, reserves1)
            return this.cache.readReserves(pair.address)
        } catch (e) {
            return { ...BAD_RESERVES, err: ERROR_GET_RESERVES_FAILED(this.version, pair.address)}
        }
    }
    /**
     * @member _V2_1_Reserves
     * @param chainid 
     * @param pair 
     * @returns contract call reserves for V2.1
     */
    private async _V2_1_Reserves( chainid: number, pair: PairAddress ) : Promise<Reserves> {
        const pair_contract = new Contract(pair.address, V2_1_PAIR_ABI, MULTICALL_PROVIDERS[chainid])
        console.log("RPC CALLING RESERVES")
        this.reserves_rpc_calls++;
        try {
            const [block_number, activeId, [reserves0, reserves1], token0, token1, liquidity] : 
                [
                    number, 
                    number, 
                    [BigNumber, BigNumber], 
                    string, 
                    string,
                    {liquidityX: BigNumber, liquidityY: BigNumber}
                ] = 
                await Promise.all([
                    PROVIDERS[chainid].getBlockNumber(), 
                    pair_contract.getActiveId(), 
                    pair_contract.getReserves(), 
                    pair_contract.getTokenX(), 
                    pair_contract.getTokenY(),
                    this._V2_NearbyLiquidity(pair_contract)
                ])
            const timestamp = Date.now()
            this.cache.setBin(activeId, pair.address)
            this.cache.setReserves(pair.address, timestamp, block_number, activeId, reserves0, reserves1, token0, token1, liquidity.liquidityX, liquidity.liquidityY)
            return this.cache.readReserves(pair.address)
        } catch (e) {
            return { ...BAD_RESERVES, err: ERROR_GET_RESERVES_FAILED(this.version, pair.address)}
        }
    }

    /**
     * @member _V2_Reserves
     * @param chainid
     * @param pair 
     * @returns contract call reserves for V2
     */
    private async _V2_Reserves( chainid: number, pair: PairAddress ) : Promise<Reserves> {
        const pair_contract = new Contract(pair.address, V2_PAIR, MULTICALL_PROVIDERS[chainid])
        console.log("RPC CALLING RESERVES")
        this.reserves_rpc_calls++;
        try {
            const [block_number, [reserves0, reserves1, activeId], token0, token1, liquidity] : 
                [
                    number, 
                    [BigNumber, BigNumber, number], 
                    string, 
                    string,
                    { liquidityX: BigNumber, liquidityY: BigNumber}
                ] = 
                await Promise.all([
                    PROVIDERS[chainid].getBlockNumber(), 
                    pair_contract.getReservesAndId(), 
                    pair_contract.tokenX(), 
                    pair_contract.tokenY(),
                    this._V2_NearbyLiquidity(pair_contract)
                ])
            
            const timestamp = Date.now()
            this.cache.setBin(activeId, pair.address)
            this.cache.setReserves(pair.address, timestamp, block_number, activeId, reserves0, reserves1, token0, token1, liquidity.liquidityX, liquidity.liquidityY)
            return this.cache.readReserves(pair.address)
        } catch (e) {
            console.log(e)
            return { ...BAD_RESERVES, err: ERROR_GET_RESERVES_FAILED(this.version, pair.address)}
        }
    }
    /**
     * @member _V2_MATH
     * @param chainid 
     * @param pair 
     * @param data 
     * @returns helper for price math for V2
     */
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
            const lowX = getDecimals(chainid, data.token0) == 8 ? parseFloat(utils.formatUnits(data.localLiquidityX, 8)) / 30000 < 10 : utils.getAddress(data.token0) == ARB_WETH ? parseFloat(utils.formatEther(data.localLiquidityX)) / 1800 < 10 : parseFloat(utils.formatUnits(data.localLiquidityX, getDecimals(chainid, data.token0))) < 10
            const lowY = getDecimals(chainid, data.token1) == 8 ? parseFloat(utils.formatUnits(data.localLiquidityX, 8)) / 30000 < 10 : utils.getAddress(data.token1) == ARB_WETH ? parseFloat(utils.formatEther(data.localLiquidityX)) / 1800 < 10 : parseFloat(utils.formatUnits(data.localLiquidityX, getDecimals(chainid, data.token1))) < 10
            return {
                ...pair,
                block_number: data.block_number,
                token0: data.token0,
                token1: data.token1,
                reserve0: parseFloat(utils.formatUnits(data.reserves0, dec0)), 
                reserve1: parseFloat(utils.formatUnits(data.reserves1, dec1)),
                yToX: price, 
                price: price != 0 ? 1 / price : 0,
                warn: lowX || lowY ? "Low liquidity around active bin" : undefined
            }
        } catch (e) {
            return {
                ...BAD_PAIR, ...pair, err: ERROR_V2_PRICE_MATH_FAILED(pair.address)
            }
        }
    }
    /**
     * @member _V1_MATH
     * @param chainid 
     * @param pair 
     * @param data Reserves object
     * @returns helper for price math for V1
     */
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

    public _V2_NearbyLiquidity = async ( pair: Contract) : Promise<{ liquidityX: BigNumber, liquidityY: BigNumber}> => {
        const last_bin = this.cache.readBin(pair.address)
        const bins = await Promise.all(
            Array(11).fill(last_bin - 5).map((x, i) => x + i).map( (bin) : Promise<[BigNumber, BigNumber]> => {
                return pair.getBin(bin)
            })
        )
        const liquidityX = bins.reduce((r, a) => r = r.add(a[0]), constants.Zero)
        const liquidityY = bins.reduce((r, a) => r = r.add(a[1]), constants.Zero)
        return { liquidityX, liquidityY }
    }
}