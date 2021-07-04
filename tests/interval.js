const test = require('tape')
const { NonOverlappingIntervalTree } = require('../')

test('change from and to from interval', function (t) {
  t.plan(6)

  const tree = new NonOverlappingIntervalTree()

  tree.add(0, 2)
  tree.add(8, 10)
  tree.add(40, 50)

  tree.getList()[0].from = 2
  tree.getList()[1].from = 9
  tree.getList()[2].to = 45

  const res = [[2, 2], [9, 10], [40, 45]]
  for (let i = 0; i < res.length; i++) {
    t.equals(tree.getList()[i].from, res[i][0])
    t.equals(tree.getList()[i].to, res[i][1])
  }
})
