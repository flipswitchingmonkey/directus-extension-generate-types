#!/bin/bash

set -o errexit
set -o nounset

pnpm install
pnpm build

mkdir -p out
cp -R dist out/
cp package.json out/
