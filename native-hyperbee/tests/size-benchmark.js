var compressed = true // set to true on 2nd run
const Hypercore = require('hypercore')
const HyperDown = require('hyperbeedown')
const Hyperbee  = require('hyperbee')
var level = require('levelup')

const core = Hypercore('./test', { sparse: true })
const bee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })

var downdb = new HyperDown(bee)

var db = level(downdb)

var max = 10*1000*1000
var ptr = 0
var batch = 5000

var name = compressed ? '1' : 'fdskfjdslkfhdsjlfhsdlkfsdlkfjwrsvjsbcxcv'
var val = '1'

var loop = function (err) {
  if (err) throw err
  if (ptr >= max) return console.log('Done. Run `du -sh db/`')

  console.log('Inserted %d rows into db', ptr)

  var ops = []
  for (var i = 0; i < batch; i++) {
    ops[i] = {type: 'put', key: name+'!'+(++ptr), value: val}
  }

  db.batch(ops, loop)
}

loop()
