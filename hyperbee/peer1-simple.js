const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ name: 'hyperbee-test' })
  await core.ready()
  await replicate(core)
  console.log('Core key is:', core.key.toString('hex'))

  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })

  await db.put('foo', 'foo-value')
  await db.put('bar', 'bar-value')
  await db.put('baz', 'cool')

  const { value } = await db.get('baz')
  console.log('baz value:', value)
}
