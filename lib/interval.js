const { FlatInterval } = require('i2bplustree')

class Interval extends FlatInterval {
  constructor (from, to, data, tree) {
    if (typeof from !== 'number' || typeof to !== 'number') {
      throw new Error('from and to must be a number')
    }
    if (from > to) throw new Error('from must be lower than to')
    if (!tree) throw new Error('tree mus be defined')

    super(from, to)
    this._data = data
    this._tree = tree
  }

  get from () {
    return this.lowerBound
  }

  get to () {
    return this.upperBound
  }

  get data () {
    return this._data
  }

  get size () {
    return (this.to - this.from) + 1
  }

  set from (from) {
    if (typeof from !== 'number') throw new Error('from must be a number')
    if (from > this.to) throw new Error('from must be lower than to')

    // Remove interval
    this._tree._delete(this)

    this.lowerBound = from

    // Insert it again
    this._tree._insert(this)
  }

  set to (to) {
    if (typeof to !== 'number') throw new Error('to must be a number')
    if (this.from > to) throw new Error('from must be lower than to')

    // Remove interval
    this._tree._delete(this)

    this.upperBound = to

    // Insert it again
    this._tree._insert(this)
  }

  set data (data) {
    this._data = data
  }

  equals (int) {
    return this.upperBound === int.upperBound &&
      this.lowerBound === int.lowerBound &&
      this.data === int.data
  }
}

module.exports = Interval
