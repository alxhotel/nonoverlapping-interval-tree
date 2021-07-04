const test = require('tape')
const { NonOverlappingIntervalTree } = require('../')

test('insert and delete events', function (t) {
  t.plan(2)

  const tree = new NonOverlappingIntervalTree()

  tree.on('insert', () => {
    t.pass('insert done')
  })

  tree.on('delete', () => {
    t.pass('delete done')
  })

  tree.add(0, 1)
  tree.remove(0, 1)
})
