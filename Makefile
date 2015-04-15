test: node_modules/mocha
	@npm test

node_modules/mocha:
	npm install

.PHONY: test
