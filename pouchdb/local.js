const ram = require('random-access-memory')
const hypercore = require('hypercore')
const HyperBee = require('hyperbee')
const HyperBeeDown = require('hyperbeedown')
const PouchDB = require('pouchdb')

start()

async function start () {
  const core = hypercore(ram)
  const tree = new HyperBee(core)

  const db = new PouchDB('mydatabase', {
    db: () => new HyperBeeDown(tree)
  })

  await db.put({ _id: '1',  hello: 'world' })
  const doc = await db.get('1')
  console.log('doc:', doc)
}
