// Run this with the hyperspace-simulator
// hyperspace-simulator index.js

const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const hypercore = require('hypercore')
const lexint = require('lexicographic-integer')

const IMDB_KEY = '1444f69f7a541e532f762c8f8847e14cc05c8b6b25886e333bc8e86e882f1033'

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ key: IMDB_KEY })

  await replicate(core)
  console.log('core:', core)

  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
  await db.ready()

  const dblocal = new Hyperbee(hypercore('./imdb', { sparse: true }), { keyEncoding: 'utf-8', valueEncoding: 'json' })
  await dblocal.ready()

  await getall(db,dblocal)

}

async function getall (db,dblocal) {
  for await (const { key, value } of db.createReadStream()) {
//    console.log(key, value)
    dblocal.put(key, value)
  }
}
