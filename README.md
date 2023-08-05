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
* Caching and request deduplication for extreme performance.
* Live at [link](https://tj-price-feed-production.up.railway.app/)


## Contents

- [TraderJoe Price Feed API](#traderjoe-price-feed-api)
  - [Contents](#contents)
  - [Cloning](#cloning)
  - [Initialization](#initialization)
  - [Managing Your Project](#managing-your-project)
    - [Initial Publish](#initial-publish)
    - [Development Workflow](#development-workflow)
      - [Hot reload](#hot-reload)
      - [Build, test, deploy](#build-test-deploy)
    - [NPMJS Updates](#npmjs-updates)
  - [Contributing](#contributing)

## Cloning

```bash
$ git clone https://github.com/ryantinder/tj-price-feed.git
$ cd tj-price-feed
$ npm i (or bun i)
```
Remember to add RPC URLS in the .env. an env.example has been provided

## Initialization



## Managing Your Project

Before committing to a project based on this template, it's recommended that you read about [Conventional Commits](https://conventionalcommits.org) and install [Commitizen CLI](http://commitizen.github.io/cz-cli/) globally.

### Initial Publish

Some additional steps need to be performed for a new project.  Specifically, you'll need to:

1. Create your project on GitHub (do not add a README, .gitignore, or license).
2. Add the initial files to the repo:
```bash
$ git add .
$ git cz
$ git remote add origin git@github.com:<your GitHub username>/<your project name>
$ git push -u origin master
```
3. Create accounts on the following sites and add your new GitHub project to them.  The project is preconfigured, so it should "just work" with these tools.
	* GitHub Actions for continuous integration.
	* [Coveralls](https://coveralls.io) for unit test coverage verification.
4. Check the "Actions" tab on the GitHub repo and wait for the Node.js CI build to complete.
5. Publish your package to NPMJS: `npm publish`

### Development Workflow

#### Hot reload
Run `npm run serve` to start your development workflow with hot reload.

#### Build, test, deploy

These steps need to be performed whenever you make changes:

0. Write awesome code in the `src` directory.
1. Build (clean, lint, and transpile): `npm run build`
2. Create unit tests in the `test` directory.  If your code is not awesome, you may have to fix some things here.
3. Verify code coverage: `npm run cover:check`
4. Commit your changes using `git add` and `git cz`
5. Push to GitHub using `git push` and wait for the CI builds to complete.  Again, success depends upon the awesomeness of your code.

### NPMJS Updates

Follow these steps to update your NPM package:

0. Perform all development workflow steps including pushing to GitHub in order to verify the CI builds.  You don't want to publish a broken package!
1. Check to see if this qualifies as a major, minor, or patch release: `npm run changelog:unreleased`
2. Bump the NPM version following [Semantic Versioning](https://semver.org) by using **one** of these approaches:
	* Specify major, minor, or patch and let NPM bump it: `npm version [major | minor | patch] -m "chore(release): Bump version to %s."`
	* Explicitly provide the version number such as 1.0.0: `npm version 1.0.0 -m "chore(release): Bump version to %s."`
3. The push to GitHub is automated, so wait for the CI builds to finish.
4. Publishing the new version to NPMJS is also automated, but you must create a secret named `NPM_TOKEN` on your project.
5. Manually create a new release in GitHub based on the automatically created tag.

## Contributing

This section is here as a reminder for you to explain to your users how to contribute to the projects you create from this template.

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
