var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var crypto = require('crypto')
var pump = require('pump')

// Creating topic
const topicHex = crypto.createHash('sha256')
  .update('imdb-feed')
  .digest()

var feed = hypercore('imdb', '2f3c1a6c50e65bb1735146e91d03f11f55d4d27dbbe72c7dko7b9226a8de82c7', {valueEncoding: 'json', eagerUpdate: true})

start()

async function start () {
  feed.on('ready', function() {
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
    pump(connection, feed.replicate(false, { live: true }), connection)
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
