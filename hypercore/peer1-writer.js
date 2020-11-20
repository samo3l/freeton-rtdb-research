var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var crypto = require('crypto')
var pump = require('pump')

// Creating topic
const topicHex = crypto.createHash('sha256')
  .update('imdb-feed')
  .digest()

var feed = hypercore('./imdb', {valueEncoding: 'json'})

start()

async function start () {
  feed.on('ready', function() {
    feed.append({
      tconst: 'tt0001287',
      titleType: 'long',
      primaryTitle: 'The Little Orphan',
      originalTitle: 'The Little Prospector',
      isAdult: '0',
      startYear: '1910',
      endYear: '\N',
      runtimeMinutes: '\N',
      genres: 'Short,Western'
    })
    startSwarm(topicHex)
  })
}

function startSwarm(topic) {
  var swarm = hyperswarm()
  swarm.join(topic, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm.on('connection', function(connection, info) {
    console.log('(New peer connected!)')
    pump(connection, feed.replicate(true, { live: true }), connection)
    logFeed(feed)
  })
}

function logFeed(feed) {
  console.log('watching', feed.key.toString('hex'), feed.length)
  console.log(feed)
    feed.createReadStream({ live: true })
    .on('data', function(data) {
      console.log(data)
    })
}
