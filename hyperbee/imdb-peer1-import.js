const { Client } = require('hyperspace')
const hypercore = require('hypercore')
const split2 = require('split2')
const fs = require('fs')
const Hyperbee = require('hyperbee')

main()

async function main () {

  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ name: 'hyperbee-test' })
  await core.ready()
  await replicate(core)

  console.log('Core key is:', core.key.toString('hex'))

  const db = new Hyperbee(core)

  const s = fs.createReadStream('test.titles').pipe(split2())

  let max = 4096
  let first = true
  let batch = db.batch()
  for await (const line of s) {
    if (first) {
      first = false
      continue
    }

    const [nconst, titleType, primaryTitle, originalTitle, isAdult, startYear, endYear, runtimeMinutes, genres] = line.split('\t')

    const data = {
      nconst,
      titleType,
      primaryTitle,
      originalTitle,
      isAdult: isAdult !== '0',
      startYear: startYear === '\\N' ? 0 : Number(startYear),
      endYear: endYear === '\\N' ? 0 : Number(endYear),
      runtimeMinutes: Number(runtimeMinutes) || 0,
      genres: genres === '\\N' ? [] : genres.split(',')
    }

    const key = 'ids!' + data.nconst

    const prev = await batch.get(key)
    const d = JSON.stringify(data)

    if (!prev || !prev.value || prev.value.toString() !== d) {
      await batch.put(key, d)
    } else {
      max--
    }

    if (batch.length > max) {
      max = 4096
      await batch.flush()
      batch = db.batch()
    }
  }

  if (batch.length) await batch.flush()
  console.log(core)
}
