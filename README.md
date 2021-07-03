# nonoverlapping-interval-tree

[![NPM Version](https://img.shields.io/npm/v/nonoverlapping-interval-tree.svg)](https://www.npmjs.com/package/nonoverlapping-interval-tree)
[![Build status](https://github.com/alxhotel/nonoverlapping-interval-tree/actions/workflows/ci.yml/badge.svg)](https://github.com/alxhotel/nonoverlapping-interval-tree/actions/workflows/ci.yml)

Non-overlapping interval tree for NodeJS.

Features:

- Two intervals can not overlap. If there is a conflict only the last interval added will be stored.
- If two adjacent intervals have the same `data` stored, they will be merged automatically into one.

## Install

```sh
npm install nonoverlapping-interval-tree
```

## Usage

```js

const { NonOverlappingIntervalTree } = require('nonoverlapping-interval-tree')

const tree = new NonOverlappingIntervalTree()

tree.add(1, 5) // [1, 5]

tree.remove(2, 3) // [1, 1], [4, 5]
```

## API

#### `const tree = new NonOverlappingIntervalTree()`

Initialize the tree

#### `tree.add(from, to, [data])`

Add an interval starting at `from` and ending at `to` (both inclusive).

The `data` parameter is the value that the interval will store.

If no `data` is provided, by default it will be `null`.

#### `tree.remove(from, to)`

Removes any overlapping part of an interval based on `from` and `to` (both inclusive).

#### `tree.getList()`

Returns a list of all the intervals.

#### `tree.size()`

Returns the total number of intervals.

## License

MIT. Copyright (c) [Alex](http://github.com/alxhotel)
