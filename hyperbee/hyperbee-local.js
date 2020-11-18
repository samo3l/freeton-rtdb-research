const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const lexint = require('lexicographic-integer')
const hypercore = require('hypercore')

start()

async function start () {

  const db = new Hyperbee(hypercore('./imdb', { sparse: true }), { keyEncoding: 'utf-8', valueEncoding: 'json' })
  await db.ready()

  await getLatest(db, 10000)

//  await getall(db)
//  console.log()

//  await getSingleId(db)
//  console.log()

//  await tenHighestRated(db)
//  console.log()

//  await tenLowestRated(db)
//  console.log()

/*
  console.log('Searching for 10 titles with the keyword: \'thrones\':')
  for await (const { key, value } of search(db, 'thrones', { limit: 10 })) {
    console.log('value:', value)
  }
*/
}

async function getLatest (db, count) {
  const rs = db.createHistoryStream({ reverse: true, limit: count }).on('data', (d) => {
    console.log(d)
  })
}

async function getSingleId (db) {
  const { value } = await db.get('ids!tt0018613')
  console.log('Record for ID tt8760684:', value)
}

async function tenHighestRated (db) {
  console.log('Getting the ten highest-rated shows:')
  const minRating = 'ratings!' + lexint.pack(0, 'hex')
  const maxRating = 'ratings!~' // ~ sorts higher than any other relevant value.
  const query = { gte: minRating, lte: maxRating, limit: 10, reverse: true }
  for await (const { key, value } of db.createReadStream(query)) {
    console.log(key, value)
  }
}

async function tenLowestRated (db) {
  console.log('Getting the ten lowest-rated shows:')
  const minRating = 'ratings!' + lexint.pack(0, 'hex')
  const maxRating = 'ratings!~'
  const query = { gte: minRating, lte: maxRating, limit: 10 }
  for await (const { key, value } of db.createReadStream(query)) {
    console.log(key, value)
  }
}

function search (db, keyword, opts = {}) {
  keyword = keyword.toLowerCase()
  return db.createReadStream({
    ...opts,
    gte: `keywords!${keyword}!`,
    lt: `keywords!${keyword}!~`,
    reverse: true
  })
}

async function getall (db) {
  for await (const { key, value } of db.createReadStream()) {
    console.log(key, value)
  }
}
