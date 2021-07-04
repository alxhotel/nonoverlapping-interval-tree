const { EventEmitter } = require('events')
const { IBplusTree: IntervalTree } = require('i2bplustree')
const Interval = require('./interval')

class NonOverlappingIntervalTree extends EventEmitter {
  constructor (opts = {}, intervalClass = null) {
    if (opts.equals && typeof opts.equals !== 'function') throw new Error('equals must be a function')
    if (intervalClass && !(intervalClass.prototype instanceof Interval)) {
      throw new Error('intervalClass must be of type Interval')
    }

    super()

    this._intervalClass = intervalClass || Interval
    this._tree = new IntervalTree()
    this._equals = opts.equals || this._defaultEquals
  }

  /**
  * "from" and "to" are both inclusive
  */
  add (from, to, data = null) {
    if (typeof from !== 'number' || typeof to !== 'number') throw new Error('from and to must be numbers')
    if (from > to) throw new Error('from must be smaller or equal than to')

    // HACK
    const currentInsertion = new (this.constructor)()
    currentInsertion._insert(this._newInterval(from, to, data))

    // Check if there are conflicting intervals
    while (true) {
      const conflictingInterval = this._findFirstConflictingInterval(from, to, data)
      if (conflictingInterval === null) break

      // Get overlapping zone
      const [overlappingFrom, overlappingTo] = this._getOverlappingZone(conflictingInterval, from, to)

      const newIntervals = this._calculateInsertions(conflictingInterval, overlappingFrom, overlappingTo, data)
      this._findAndReplace(conflictingInterval, newIntervals)

      // Try to merge neighbouring intervals
      // a [a] a => merges left and right
      // a [a|b] a => merges left
      // a [b|a] a => merges right
      // a [b|a|b] a => does never merge anything
      // NOTE: newIntervals can only be max 3 intervals and the neighbours have different data
      // than their neighbours. So only ONE of this "_tryMerge"s will actually do some merging
      this._tryMerge(newIntervals[0])
      if (newIntervals.length > 1) {
        this._tryMerge(newIntervals[newIntervals.length - 1])
      }
    }

    // Remove overlappings from current insertion
    const overlappingIntervals = this._findOverlappingIntervals(from, to)
    for (const interval of overlappingIntervals) {
      const [overlappingFrom, overlappingTo] = this._getOverlappingZone(interval, from, to)
      currentInsertion.remove(overlappingFrom, overlappingTo)
    }

    // Check if there are more insertions
    for (const interval of currentInsertion.getList()) {
      this._insertToList(interval.from, interval.to, data)
    }
  }

  /**
  * "from" and "to" are both inclusive
  */
  remove (from, to) {
    if (typeof from !== 'number' || typeof to !== 'number') throw new Error('from and to must be numbers')
    if (from > to) throw new Error('from must be smaller or equal than to')

    // Find overlapping intervals
    const intervals = this._findOverlappingIntervals(from, to)

    for (const interval of intervals) {
      // Check if whole interval is out
      if (from <= interval.from && interval.to <= to) {
        this._delete(interval)
        continue
      }

      const [overlappingFrom, overlappingTo] = this._getOverlappingZone(interval, from, to)

      // No need to try to merge
      const newIntervals = this._calculateRemoval(interval, overlappingFrom, overlappingTo)
      this._findAndReplace(interval, newIntervals)
    }
  }

  getList () {
    const res = []

    // HACK
    function rr (i) {
      if (i instanceof Interval) {
        res.push(i)
        return
      }

      for (const c of i.children) {
        rr(c)
      }
    }

    rr(this._tree.root)

    return res
  }

  size () {
    return this.getList().length
  }

  _newInterval (from, to, data) {
    return new (this._intervalClass)(from, to, data, this)
  }

  _defaultEquals (a, b) {
    return a === b
  }

  _insert (int) {
    this._tree.insert(int)
    this.emit('insert', int)
  }

  _delete (int) {
    this._tree.delete(int)
    this.emit('delete', int)
  }

  _calculateRemoval (interval, from, to) {
    const res = []
    if (interval.from <= from - 1) {
      const leftNewInterval = this._newInterval(interval.from, from - 1, interval.data)
      res.push(leftNewInterval)
    }
    if (to + 1 <= interval.to) {
      const rightNewInterval = this._newInterval(to + 1, interval.to, interval.data)
      res.push(rightNewInterval)
    }
    return res
  }

  _insertToList (from, to, data = null) {
    const newInterval = this._newInterval(from, to, data)

    this._insert(newInterval)

    // Try merge
    this._tryMerge(newInterval)
  }

  _getOverlappingZone (interval, from, to) {
    const overlappingFrom = Math.max(interval.from, from)
    const overlappingTo = Math.min(interval.to, to)

    return [overlappingFrom, overlappingTo]
  }

  _findOverlappingIntervals (from, to) {
    return this._tree.allRangeSearch(from, to)
  }

  _findFirstConflictingInterval (from, to, data) {
    // HACK

    const self = this
    function rr (node) {
      if (node instanceof Interval) {
        if (!self._equals(node.data, data)) return node
        else return null
      }

      for (let i = 0; i < node.keys.length; i++) {
        const otherFrom = node.keys[i]
        const otherTo = node.maximums[i]

        if (!(otherFrom > to || otherTo < from)) {
          const res = rr(node.children[i])
          if (res !== null) return res
        }
      }

      return null
    }

    return rr(this._tree.root)
  }

  _calculateInsertions (conflictingInterval, from, to, data) {
    const res = []
    if (conflictingInterval.from <= from - 1) {
      const leftNewInterval = this._newInterval(conflictingInterval.from, from - 1, conflictingInterval.data)
      res.push(leftNewInterval)
    }
    const middleNewInterval = this._newInterval(from, to, data)
    res.push(middleNewInterval)
    if (to + 1 <= conflictingInterval.to) {
      const rightNewInterval = this._newInterval(to + 1, conflictingInterval.to, conflictingInterval.data)
      res.push(rightNewInterval)
    }
    return res
  }

  _findAndReplace (interval, newIntervals) {
    // Remove previous
    this._delete(interval)

    // Add list of intervals
    for (const i of newIntervals) {
      this._insert(i)
    }
  }

  _tryMerge (interval) {
    // Check left side
    const leftInterval = this._tree.loneRangeSearch(interval.from - 1, interval.from - 1)
    if (leftInterval && this._equals(interval.data, leftInterval.data)) {
      // Remove both
      this._delete(leftInterval)
      this._delete(interval)

      // Insert new one
      const newInterval = this._newInterval(leftInterval.from, interval.to, interval.data)
      this._insert(newInterval)

      // Update values
      interval = newInterval
    }

    // Check right side
    const rightInterval = this._tree.loneRangeSearch(interval.to + 1, interval.to + 1)
    if (rightInterval && this._equals(interval.data, rightInterval.data)) {
      // Remove both
      this._delete(interval)
      this._delete(rightInterval)

      // Insert new one
      const newInterval = this._newInterval(interval.from, rightInterval.to, interval.data)
      this._insert(newInterval)
    }
  }
}

module.exports = NonOverlappingIntervalTree
