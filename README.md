<p align="center">
  <h1 align="center">directus-extension<br />generate-types</h1>
  <h4 align="center">Create types for your directus project in your favourite language.</h4>
</p>

<img width="1588" height="1262" alt="image" src="https://github.com/user-attachments/assets/8d536029-2738-499e-a9e3-b1ed3f719cb9" />

## Motivation

This fork extends this very useful extension with a few custom options that fit my wokflow better. Your mileage may vary.

Since I made a number of deeper changes and also use custom gh actions, I decided to hard fork the repo in the end.

The original can be found at https://github.com/maltejur/directus-extension-generate-types

### Currently supports

- TypeScript
- Python Type Hints
- OpenAPI Specification

TypeScript includes optional ItemsService helpers for each Collection.

A TypeScript version that includes Zod Schemas is... experimental. I'm not particularly happy with the inferred types coming from Zod.

## How to build

1. `pnpm install`
2. `pnpm build`
3. copy `package.json` and `dist`-Folder into your `/extensions` in Directus under a fitting name...

## How to test

Use the included Docker Compose file to run a simple test setup by running the `./docker/up.sh` script.
