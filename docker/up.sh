#!/bin/bash

set -o errexit
set -o nounset

pnpm install
pnpm run build

docker compose --file docker/compose.yaml build directus --no-cache
docker compose --file docker/compose.yaml up
