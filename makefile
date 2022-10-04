SRC   := $(shell find src -name *.ts)
TESTS := $(shell find src -name *.spec.ts)

all: help

## help:		show this help
.PHONY: help
help:
	@sed -n 's/^##//p' Makefile

## run:		run the app
.PHONY: run
run: build
	node ./dist

## build:		build TypeScript source
.PHONY: build
build: node_modules dist

.PHONY: dist
dist: clean ${SRC} tsconfig.json
	./node_modules/.bin/tsc -p tsconfig-build.json
	touch $@

.PHONY: node_modules
node_modules: package.json
	npm install
	touch $@

## test:		run tests
## 		set FILE to limit to specific spec
.PHONY: test
ifdef FILE
test: node_modules build
	./node_modules/.bin/ts-mocha --full-trace -b ${FILE}
else
test: node_modules build
	./node_modules/.bin/c8 \
		--reporter=none \
		./node_modules/.bin/ts-mocha --full-trace -b --recursive ${TESTS}
	./node_modules/.bin/c8 report \
		--all \
		--exclude 'coverage/' \
		--exclude 'src/types.*' \
		--exclude 'src/**/*.spec.ts' \
		--exclude-after-remap \
		--reporter=html \
		--reporter=text
endif

## test-debug:	run tests in debugger (opens chrome)
.PHONY: test-debug
test-debug:
	# MUST pass FILE variable like make test-debug FILE=./test.ts
	open -a 'google chrome' chrome://inspect && \
		node --nolazy --inspect-brk \
		./node_modules/.bin/mocha -b -r ts-node/register --timeout 999999 ${FILE}

## clean-dist:	delete generated files and dependencies
.PHONY: clean-dist
clean-dist:
	rm -rf coverage dist node_modules package-lock.json


## clean:		delete generated files
.PHONY: clean
clean:
	-rm -rf coverage dist
