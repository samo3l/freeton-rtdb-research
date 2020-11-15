const REMOTE_KEY = 'dcdf2cd661186ff254624ef13e38686a7f8a1abdb7d78f3c724ee10b86521d80'

const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()
  const core = store.get({ key: REMOTE_KEY })

  await core.ready()
  await replicate(core)
  console.log(core)

  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })

  const { value } = await db.get('ids!tt0000001')
  console.log(value)
}
