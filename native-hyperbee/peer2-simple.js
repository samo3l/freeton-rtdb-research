const STATS_CORE_KEY = 'a12be11e72823e18afb753b52c82f40aa1089c3427343ccfdd05c7883252fed4'

const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ key: STATS_CORE_KEY, valueEncoding: 'json' })

  await core.ready()
  console.log('Core key is:', core.key.toString('hex'))
  console.log(core)

  // Create a new Hyperbee database with String keys/values.
  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })

  const { value } = await db.get('baz')
  // This should be 'baz-value'. Same idea for the other keys.
  console.log('baz value:', value)
}
