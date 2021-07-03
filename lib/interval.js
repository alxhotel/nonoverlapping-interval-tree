const { FlatInterval } = require('i2bplustree')

class Interval extends FlatInterval {
  constructor (from, to, data) {
    if (typeof from !== 'number' || typeof to !== 'number') {
      throw new Error('from and to must be a number')
    }
    if (from > to) throw new Error('from must be lower than to')

    super(from, to)
    this._data = data
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

    this.lowerBound = from
  }

  set to (to) {
    if (typeof to !== 'number') throw new Error('to must be a number')
    if (this.from > to) throw new Error('from must be lower than to')

    this.higherBound = to
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
