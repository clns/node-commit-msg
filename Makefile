.SUFFIXES:            # Delete the default suffixes
.PHONY: test

test: node_modules/mocha
	@npm test

node_modules/mocha:
	npm install
