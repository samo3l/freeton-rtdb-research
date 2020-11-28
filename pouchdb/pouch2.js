const ram = require('random-access-memory')
const hypercore = require('hypercore')
const HyperBee = require('hyperbee')
const HyperBeeDown = require('hyperbeedown')
var express = require('express')
  , app     = express()
  , PouchDB = require('pouchdb');

start()

async function start () {

  await app.use('/db', require('express-pouchdb')(PouchDB))

  const tree = new HyperBee(hypercore('./core', { sparse: false }), { keyEncoding: 'utf-8', valueEncoding: 'json' })
  await tree.ready()

  const db = new PouchDB('test1-replica', {
    db: () => new HyperBeeDown(tree)
  })

  const remoteDB = new PouchDB('http://< REMOTE IP >>:3000/db/test1')

  await db.replicate.from(remoteDB, {
    live: false
  }).on('complete', function (result) {
    console.log(result)
  }).on('error', function (err) {
    console.log(err)
  })

  try { 
    var doc = await db.get('1')
    console.log(doc)
  } catch (err) {
    console.log(err)
  }

  app.listen(3000)
}
