# TraderJoe Price Feed API

[![Package Version][package-image]][package-url]
[![Dependencies Status][dependencies-image]][dependencies-url]
[![Build Status][build-image]][build-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Open Issues][issues-image]][issues-url]
[![Commitizen Friendly][commitizen-image]][commitizen-url]

My submission for @crytofish7's Trader Joe price feed API. Featuring:

* Support for all V1, V2, V2.1 pairs.
* Support for fetching single pair pricing, or batch requests with POST.
* Support for Arbitrum, Avax, and BSC all in one API.
* Comprehensive testing suite included.
* JavaScript ports of onchain math libraries for better performance.
* Caching and request deduplication for extreme performance.
* Live at [link](https://tj-price-feed-production.up.railway.app/)


## Contents

- [TraderJoe Price Feed API](#traderjoe-price-feed-api)
  - [Contents](#contents)
  - [Cloning](#cloning)
  - [Initialization](#initialization)
  - [Caching](#caching)
  - [Tests](#tests)

## Cloning

```bash
$ git clone https://github.com/ryantinder/tj-price-feed.git
$ cd tj-price-feed
$ npm i (or bun i)
$ npm run start
```
Remember to add RPC URLS in the .env. an env.example has been provided. Then start the app on localhost:3333.

## Initialization
The api begins by running a short script to initialize every pair on arbitrum. If your rpc doesn't support getLogs on block ranges > 1000, the script will interrupt but the api should still function as intended.



## Caching
Caching is supported for pair addresses and reserves. Each time a new pair is called, the api will cache the pair's address into memory. Subsequent calls to that pair will only require 1 RPC call, for as long as the API is continuously run. In testing, this first layer of caching reduced response time by 50%.

Secondly, the default cache timeout length for reserves is 100ms, but can be changed in /src/lib/cache.ts. In the context of a blockchain, it makes sense to cache results based on blocknumber, however L2s produce new blocks so quickly that this is generally leads to no improvement. Therefore, I just use traditional ms caching. If both caches are hit in a request, the response time is reduced by _99.9%_.

## Tests
Testing for the repo is split between 3 separate suites. 
* Unit tests for pricing are found in test/core.test.ts. 
* Integration and e2e tests for the express router are in test/api.test.ts
* Load and performance tests are in test/load.test.ts

[build-image]: https://img.shields.io/github/actions/workflow/status/chriswells0/node-typescript-template/ci-build.yaml?branch=master
[build-url]: https://github.com/chriswells0/node-typescript-template/actions/workflows/ci-build.yaml
[commitizen-image]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli
[coverage-image]: https://coveralls.io/repos/github/chriswells0/node-typescript-template/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/chriswells0/node-typescript-template?branch=master
[dependencies-image]: https://img.shields.io/librariesio/release/npm/typescript-template
[dependencies-url]: https://www.npmjs.com/package/typescript-template?activeTab=dependencies
[issues-image]: https://img.shields.io/github/issues/chriswells0/node-typescript-template.svg?style=popout
[issues-url]: https://github.com/chriswells0/node-typescript-template/issues
[package-image]: https://img.shields.io/npm/v/typescript-template
[package-url]: https://www.npmjs.com/package/typescript-template
[project-url]: https://github.com/chriswells0/node-typescript-template
