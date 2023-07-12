import { E18, E6_ADDRESSES, E8_ADDRESSES } from './constants'
import { BigNumber, constants, ethers, utils } from 'ethers'

export const getDecimals = (chainid: number, addr: string) => {
	return E8_ADDRESSES[chainid].includes(utils.getAddress(addr)) ? 8 : E6_ADDRESSES[chainid].includes(utils.getAddress(addr)) ? 6 : 18
}

export const TEN_POW = (exp: number) => {
	return BigNumber.from(10).pow(exp)
}
export const SCALE = BigNumber.from(1).shl(128)
/**
 * @dev Calculates the price from the id and the bin step
 * @param id The id
 * @param binStep The bin step
 * @return price The price as a 128.128-binary fixed-point number
 */
export const getPriceFromId = (id: number, binStep: number) => {
	const base = SCALE.add(BigNumber.from(binStep).shl(128).div(10000));

	const exponent =  BigNumber.from(id).sub(BigNumber.from(1).shl(23));
	return pow(base, exponent);
}
/**
 * TS port of u128x128xtoDec from Remcoe Bloemen
 * @param u128x128 
 * @returns 
 */
export const u128x128toDec = (u128x128: BigNumber) => {
	// mult shift round down
	let result = BigNumber.from(0)
	const mm = u128x128.mul(E18).mod(constants.MaxUint256)
	const prod0 = u128x128.mul(E18)
	const prod1 = (mm.sub(prod0)).sub( mm.lt(prod0) ? 1 : 0 ) 
	if (!prod0.eq(0)) {  
		result = prod0.shr(128)
	}
	if (!prod1.eq(0)) {
		result = result.add(prod1.shl(128));
	}
	return result;
}
/**
 * @notice Returns the value of x^y. It calculates `1 / x^abs(y)` if x is bigger than 2^128.
 * At the end of the operations, we invert the result if needed.
 * ASSUMES POSITIVE EXPONENT BECAUSE IM LAZY
 * @param x The unsigned 128.128-binary fixed-point number for which to calculate the power
 * @param y A relative number without any decimals, needs to be between ]2^21; 2^21[
 */
const pow = (x: BigNumber, y: BigNumber) => {
	let invert = false;
	const absY = y;
	let result = BigNumber.from(0);

	if (y.eq(0)) return SCALE;    

	if (absY.lt('0x100000')) {
		result = SCALE;
		let squared = x
		if (x.gt('0xffffffffffffffffffffffffffffffff')) {
			squared = ethers.constants.MaxUint256.div(squared);
			invert = !invert;
		}
		const str = parseInt(y.toString()).toString(2)
		for (let i = 1; i <= 20; i++ ) {
			if (str[str.length - i] == '1') {
				result = wrapMul(result, squared).shr(128) 
			}
			squared = squared.mul(squared).shr(128);
		}
	}
	return invert ? ethers.constants.MaxUint256.div(result) : result;
}

const wrapMul = (x: BigNumber, y: BigNumber) => {
	return x.mul(y).mod(constants.MaxUint256)
}

export const sortTokens = (a: string, b: string) : [string, string] => {
	return a < b ? [a, b] : [b, a]
}