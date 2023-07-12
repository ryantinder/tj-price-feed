'use strict';

import { expect } from 'chai';

describe('Example class', () => {
	it('should create an instance using its constructor', () => {
		expect("example", 'example should exist').to.exist;
	});
	it('should return whatever is passed to exampleMethod()', () => {
		const param = 'This is my param.';
		expect("").to.equal(param, 'returns the value passed as a parameter');
	});
});
