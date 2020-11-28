const ram = require('random-access-memory')
const hypercore = require('hypercore')
const HyperBee = require('hyperbee')
const HyperBeeDown = require('hyperbeedown')
var express = require('express')
  , app     = express()
  , PouchDB = require('pouchdb');
require('events').EventEmitter.prototype._maxListeners = 100

start()

async function start () {

  app.use('/db', require('express-pouchdb')(PouchDB))

  const tree = new HyperBee(hypercore('./core', { sparse: false }), { keyEncoding: 'utf-8', valueEncoding: 'json' })
  await tree.ready()

  const db = new PouchDB('test1', {
    db: () => new HyperBeeDown(tree)
  })

  await db.put({ _id: '1',  hello: 'world' })

  app.listen(3000)
}
