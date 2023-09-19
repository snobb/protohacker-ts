SRC   := $(shell find src -name *.ts)
TESTS := $(shell find src -name *.spec.ts)
FLY_APP := protohacker-ts

all: help

## help:		show this help
.PHONY: help
help:
	@sed -n 's/^##//p' makefile

## run:		run the app
.PHONY: run
run: build
	node --enable-source-maps ./dist

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
.PHONY: test
test: node_modules build
	node --test --experimental-test-coverage --require @swc-node/register ./src/**/*.test.ts ./src/**/**/*.test.ts

## test-watch:	run tests and watch for changes
.PHONY: test-watch
test-watch : node_modules build
	node --test --require @swc-node/register --watch ./src

## test-debug:	run tests in debugger (opens chrome)
.PHONY: test-debug
test-debug:
	# MUST pass FILE variable like make test-debug FILE=./test.ts
	open -a 'google chrome' chrome://inspect && \
		node --nolazy --enable-source-maps --inspect-brk \
		./node_modules/.bin/mocha -b -r ts-node/register --timeout 999999 ${FILE}

## clean-dist:	delete generated files and dependencies
.PHONY: clean-dist
clean-dist:
	rm -rf coverage dist node_modules package-lock.json

## launch:	create a fly.io application for typescript (run one time)
launch:
		fly launch --copy-config --local-only --name ${FLY_APP} \
			--no-deploy -r lhr && \
		fly ips allocate-v6 -a ${FLY_APP}

## deploy:	deploys the latest change to fly.io
.PHONY: deploy
deploy: build
	flyctl deploy --local-only

## clean:		delete generated files
.PHONY: clean
clean:
	-rm -rf coverage dist
