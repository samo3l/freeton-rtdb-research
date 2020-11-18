var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var multifeed = require('multifeed')
var crypto = require('crypto')
var pump = require('pump')

if (process.argv.length !== 3) {
  console.log('USAGE: "node multifeed.js 1" or "node multifeed.js 2"')
  process.exit(1)
  return
}
var num = process.argv[2]

// Creating topic
const topicHex = crypto.createHash('sha256')
  .update('imdb')
  .digest()

var multi = multifeed('./imdb' + num, {
  valueEncoding: 'json'
})

multi.writer('local', function(err, feed) {
  startSwarm(topicHex)
  printChatLog()

  feed.append({
      tconst: 'tt0001287',
      titleType: 'short',
      primaryTitle: 'The Little Orphan',
      originalTitle: 'The Little Prospector',
      isAdult: '0',
      startYear: '1910',
      endYear: '\N',
      runtimeMinutes: '\N',
      genres: 'Short,Western'
    })

})

function startSwarm(topic) {
  var swarm = hyperswarm()
  swarm.join(topic, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm.on('connection', function(connection, info) {
    console.log('(New peer connected!)')
    pump(connection, multi.replicate(info.client, { live: true }), connection)
  })
}

function printChatLog() {
  multi.ready(function() {
    var feeds = multi.feeds()
    feeds.forEach(logFeed)
    multi.on('feed', logFeed)
  })
}

function logFeed(feed) {
  console.log('watching', feed.key.toString('hex'), feed.length)
  feed.createReadStream({ live: true })
    .on('data', function(data) {
      feed.head(console.log)
    })
}
