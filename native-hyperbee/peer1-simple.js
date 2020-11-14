const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ name: 'hyperbee-test' })
  await core.ready()
  console.log('Core key is:', core.key.toString('hex'))

  // Create a new Hyperbee database with String keys/values.
  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })

  await db.put('foo', 'foo-value')
  await db.put('bar', 'bar-value')
  await db.put('baz', 'cool')

  const { value } = await db.get('baz')
  // This should be 'baz-value'. Same idea for the other keys.
  console.log('baz value:', value)
}
