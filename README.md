# Research of the possible FreeTON RTDB solutions


## Introduction

This work was done within the framework of FreeTON DevExp subgov contests **#5 RTDB**: Analyze Hypercore internals and **#3 RTDB**: Hypercore test-drive. It includes theory and technical explanation together with practical examples and tests. We will consider Hypercore first as a basic for RTDB, including protocol explanation, setup examples, replication and tests. The major part of work is based on research - what tools are built on hypercore, what pros and cons they have, and where they require improvements.


## Pre-requirements

To follow a practical part of this research you need the following:



*   at least 2 Ubuntu 18.04 VMs
*   Node JS v14.15.0
*   NPM
*   build-essential autoconf automake g++ libtool


## Basics


### Hypercore	

	

Hypercore-protocol is a basis for almost everything described in this doc. Hypercore internals info could be found here:



*   [Very friendly technical explanation of the hypercore protocol with cool live diagrams ](https://hypercore-protocol.org/#hypercore)
*   [White-paper of Dat project, which is based on hypercore, including replication, crypto algorithms explanations, description of messages etc. ](https://github.com/datprotocol/whitepaper/blob/master/dat-paper.pdf )
*   [Hypercore protocol  state machine (protocol messages handling).](https://github.com/mafintosh/simple-hypercore-protocol)

	

**Short summary** - Hypercore is a secure, distributed append-only log implemented using Hypercore-protocol. Based on Hypercore protocol we can build different decentralized applications like chats, browsers, databases, fuse, or any other applications. In Hypercore, we introduce the idea of "writers" and "readers". A Hypercore can only be appended to by its original creator, the writer. The writer maintains a private key which they use to sign a new proof each time data is appended to the Hypercore. When sharing the Hypercore with readers, the writer sends along proofs as well, so that the reader can verify that the Hypercore hasn't been tampered with.

Since proofs are distributed widely among all readers, a powerful feature emerges: Readers can share Hypercores with other readers, without needing to involve the writer at all -- they just need to re-send the proofs they were given by the writer! This is great for P2P systems. It keeps things resilient, because readers can keep the Hypercore available even after the writer goes offline, and it enables "bandwidth sharing", because readers can share the burden of distribution.

Hypercore uses an asymmetric key encryption scheme to sign and encrypt all the data. Each append-only log we make is identified by a globally unique public key. Using cryptography and the P2P network provided by Hyperspace this means that we can share the cores we create with other people around the world by simply sharing the public key.

There are 3 keys to keep in mind when using Hypercore:



1. Public Key. This key is globally unique. It is used to identify our feed publicly, and also allows us to verify that data has not been tampered with when replicating with peers we do not necessarily trust. We can also encrypt a message using someone else's public key so that nobody else but them can decrypt it.
2. Secret Key. In Hypercore, only the feed’s owner (whoever has the secret key) can write to the log. This key is kept only on the person’s local machine and it is never shared with anyone. The secret key is used to decrypt messages encrypted with our public key, as well as for signing messages we've written to prove that we are the original author.
3. Discovery Key. We recognize our feed by its unique public key and allow only those peers who know this key to be able to exchange information.We might not want other parties to know our public key, since it uniquely identifies us. So we make use of another key, derived via a one-way function from our public key, that we can freely share. This is called the discovery key. It is a hash of the public key. This key is used to discover peers without leaking the public key.

There are several hypercore implementation on different programming languages, namely:



*   JavaScript  - the first hypercore protocol realization which is most widely used 
*   Rust - most completed alternative to original js implementation, already released but still very unfinished
*   Python - not released yet, W.I.P.
*   C++ - not released yet, W.I.P.

	Our research is based on JavaScript implementation due to the fast that its most reliable and commonly used implementation for now. 


#### Hyperswarm

Hypercore supports feed sharing with another machine (or peers), and calls the process of machines exchanging the messages - feed replication. The Hypercore Protocol comes with a sharing and discovery system called Hyperswarm. using Hyperswarm, you can ask the global network "Who has the Hypercore with key X?" and Hyperswarm will reply with peers you can connect to and replicate from. Hyperswarm is not encrypted by default. But this can be achieved using [noise-network](https://github.com/mafintosh/noise-network). The best technical Hyperswarm explanation can be found [here](https://hypercore-protocol.org/#hyperswarm ). 


##### 	Setup example



1. The following example will demonstrate how to create Hypercore feed, write data on it, replicate feed, and get data from another device.
    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to hypercore directory
    3. Install dependencies
    4. Review and run [peer1-writer.js](https://github.com/samostrovskyi/freeton-rtdb-research/blob/master/hypercore/peer1-writer.js) on the first Ubuntu VM
    5. Copy public key from an output to [peer2.js](https://github.com/samostrovskyi/freeton-rtdb-research/blob/master/hypercore/peer2.js)
    6. Review and run [peer2.js](https://github.com/samostrovskyi/freeton-rtdb-research/blob/master/hypercore/peer2.js) on the Ubuntu VM

The same processes happen under the hyperspace module, described below. But here we demonstrated native Hypecore + Hyperswarm stack first.


#### Hyperspace

[Hyperspace](https://github.com/hypercore-protocol/hyperspace) can help here. It’s a "batteries-included" module that lets you create and share Hypercores with minimal overhead. Hyperspace is a lightweight server that provides remote access to Hypercores and a Hyperswarm instance. It exposes a simple [RPC interface](https://github.com/hyperspace-org/rpc) that can be accessed with the [Hyperspace client for Node.js](https://github.com/hyperspace-org/client). It’s really easy to use, just start as a daemon on your machine and code becomes easy. In the project repository we used scripts with hyperswarm directly and hyperspace to show the difference. 


### Hypercore alternatives

**SSB **

SSB might be an alternative to hypercore. You can familiarize yourself with SSB protocol [here](https://ssbc.github.io/scuttlebutt-protocol-guide/). But key differences are the following:



*   SSB is a peer-to-peer network for streaming feeds of JSON objects. Its primary data-structure is the "feed."
*   SSB is not suited for streaming, as it does not have a sparse data structure (enabled in Hypercore by Merkle trees, while SSB uses linked lists).
*   SSB uses a gossip protocol to sync data between peers. It does not automate peer discovery for a given dataset (e.g. via DHT) so topology must be manually managed. Hypercore uses a DHT to automate discovery of peers for exchanging of data.
*   SSB is primarily focused on social media applications. Hypercore has been growing towards a more generic model of structured data (file systems, databases) spread and synchronized over many devices.

**LF **                

LF is a fully decentralized fully replicated key/value store which builds on [directed acyclic graph (DAG)](https://en.wikipedia.org/wiki/Directed_acyclic_graph) data model and goes with CRDT out of the box. Project itself looks abandoned without activity.          


## Hyperbee stack

This is the most interesting part of the research, because it’s fully compatible with LevelDB, which is used commonly by devs. It supports all the required features and is rapidly developing by community. We also join the community to improve some replication issues, and solve it in a few days together. 


### Architecture chart

```
PouchDB ------|

Linvodb3 ------| All the level compatible DBs

Kinesalite ------|

Dynalite --------|

hyperbeedown  -------| A LevelDOWN-compliant backend for Hyperbee

  multi-hyperbee ------| Adds multi-writer support

    hyperbee ------------| Key/value store

      hyperswarm ------| replicator

        noise-network --| encryption

          hypercore ------| p2p realization

          	   hypercore-protocol
```

	As you can see from this chart, we can use the Hypercore ecosystem as an alternative to LevelDB (Google key/value store), but providing P2P communication. So, it will be very easy for developers to work with decentralized apps, because DBs API will be the same. Lets go deeper to some components. 


### 	Hyperbee

[Hyperbee](https://github.com/mafintosh/hyperbee) is a P2P key/value store built on top of a Hypercore using an embedded index that projects a B-tree to find and store data. Actively used by [Bitfinex](https://github.com/bitfinexcom/bitfinex-terminal-key-encoding). It also exposes a sorted iterator API that allows you to use the embedded index to efficiently find ranges between two keys, which is useful when you want to build generic databases with Hyperbee as a foundation. 

Since Hyperbee stores all its data in a Hypercore, it inherits all the great replication features from that, meaning it's P2P, very fast to sync only a subset, and all data is signed and secure by the writer producing the database. 

B-tree is a self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time. The B-tree generalizes the binary search tree, allowing for nodes with more than two children. Unlike other self-balancing binary search trees, the B-tree is well suited for storage systems that read and write relatively large blocks of data, such as disks. It is commonly used in databases and file systems.


##### 	Setup examples

**_NOTE_**: we will demonstrate here Hyperspace module usage as a basis instead of native Hypercore + Hyperswarm from the previous example.


1. The following example will demonstrate how to download data from a remote peer, upload to another local core and get some data from it.
    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to hyperbee directory
    3. Install dependencies
    4. Review and run download.js to download test data from IMDB core with movies titles
    5. Review and run hyperbee-local.js to read data
    6. Play with hyperbee-local.js, try different functions
2. The following example will demonstrate how to put data into the Hyperbee on the 1st device and read from the 2nd.
    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to hyperbee directory
    3. Install dependencies
    4. Run Hyperspace 
        _hyperspase -s my_storage_dir_
    5. Review and run peer1-simple.js on the 1st VM
    6. Review and run peer2-simple.js on the 1st VM
3. The following example will demonstrate how to import data from tsv and load to Hyperbee, then share that data with remote.
    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to hyperbee directory
    3. Install dependencies
    4. Run Hyperspace 
        _hyperspase -s my_storage_dir_
    5. Review and run imdb-peer1-import.js on the 1st VM
    6. Review and run imdb-peer2.js on the 2nd VM


### 	Multi-hyperbee

[Hyperbee](https://github.com/mafintosh/hyperbee) is a one-of-a-kind steaming database that can change the way we work with databases. But like all other low-level components of the hypercore ecosystem it is a single-writer data structure. Multi-writer is a higher-level abstraction, hence the name [multi-hyperbee](https://github.com/tradle/multi-hyperbee) - a LevelUP compatible leaderless multi-master database with eventual consistency, using hyperbee + CRDT + HLC. Pure P2P [streaming](https://github.com/tradle/why-hypercore/blob/master/FAQ.md#what-is-the-usp-unique-selling-proposition-of-hypercore) database, with zero central management. LevelDB compatibility allows to use a lot of DBs on top of it with multiple tables, auto-updated secondary indexes, and fairly complex queries combining those indexes.


##### Setup example

_	**NOTE**: the following example was prepared together with the Hypercore community during this research, details are described [here](https://github.com/tradle/multi-hyperbee/issues/5)._



1. The following example will demonstrate what is multi-writer based Hyperbee. You will be able to put data to DB on 1st VM and get it on a 2nd.
    1. Clone [https://github.com/tradle/multi-hyperbee](https://github.com/tradle/multi-hyperbee) 
    2. Install dependencies
    3. Run _node examples/example.js -s storage1_ on 1st VM
    4. Run _node examples/example.js -s storage2_ on 2nd VM

        _NOTE_: It will create a directory structure for MultiHyperbee and print the key of the Diff Hyperbee. You should use those keys to connect peers. 

    5. Run _node examples/example.js -s storage1 -k &lt;2ndVM_KEY>_ on 1st VM
    6. Run _node examples/example.js -s storage2 -k &lt;1stVM_KEY>_ on 2nd VM
    7. input data on both VMs using stdin
    8. exit scripts and run _cat storage1/data_ on 1st VM and _cat storage2/data_ on 2nd VM to see if data were replicated


### 	Hyberbeedown

An abstraction under the Hyperbee that allows it to be one by one compatible with LevelDB. This is awesome as there are many databases that work on top of the LevelUP API exposed by LevelDB. One example is AWS DynamoDB emulation on top of LevelDB. See its [replacement with Hyperbee](https://github.com/tradle/dynalite/) using the [Hyperbeedown](https://github.com/andrewosh/hyperbeedown).


### 	LevelDB compatible DBs	

A lot of solutions exist, but we will consider some of them.


#### PouchDB

[PouchDB](https://pouchdb.com/) is an open-source JavaScript database inspired by Apache CouchDB.

PouchDB was created to help web developers build applications that work as well offline as they do online. It enables applications to store data locally while offline, then synchronize it with CouchDB and compatible servers when the application is back online, keeping the user's data in sync no matter where they next login.

In Node.js, PouchDB uses LevelDB under the hood, and also supports many other backends via the LevelUP ecosystem. PouchDB can also run as its own CouchDB-compatible web server, using PouchDB Server. One of those backends might be Hyberbee. Let's provide some examples.


##### Setup examples



1. The following example will demonstrate how to run PouchDB locally based on Hypercore stored in RAM and Hyperbee created from this core. 
    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to pouchdb directory
    3. Install dependencies
    4. Review and run local.js

    Expected result - to be able to write and read data from local DB.

2. There are three ways to replicate data between hosts:
    1. Use pouchdb native sync between independent hypercores on each node. 

    The following example will demonstrate how to run a PouchDB server based on an express module and replicate data from 1 device to another.

    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to pouchdb directory
    3. Install dependencies
    4. Review and run pouch1.js on 1st Ubuntu VM
    5. Review and run pouch2.js on 2nd Ubuntu VM

    **_NOTE: _**we were not able to reproduce this scenario based on Hyperbee (native Pouchdb approach works). But technically it’s possible but probably Pouchdb replicate module should be extended to support hyperbee.

    2. The second method is replication on hypercore level and pouchdb just as an interface for accessing data. E.q you can use multi-hyperbee (multi-write hyperbee) for this purpose.  (see multi-hyperbee section in this document and scripts in _multi-hyperbee _directory in the project repository)
    3. We can run pouchdb to work with hyperbee data by writing pouchdb-adapter based on [leveldb-core](https://www.npmjs.com/package/pouchdb-adapter-leveldb-core/v/7.1.1). No one tried it, at least publicly but in our opinion it will be easy to implement and test. 
    4. Another example of integration it’s [this plugin](https://github.com/garbados/pouchdb-hypercore) which extend pouchdb functions (works only in read only mode but can be extended to support writing also)   


#### 	Dynalite

Dynalite is an implementation of Amazon's DynamoDB and can run on [Hyperbee](https://github.com/mafintosh/hyperbee) or Multi-Hyperbee. Dynalite is cool as it is implementing secondary indexes, auto-update of secondary indexes, complex queries, and multi-table support in one LevelUP DB (read hyperbee). So writing applications based on this database is much simpler. See more details [here](https://github.com/tradle/dynalite). We will be focused on examples.


##### Setup examples


The following example will demonstrate how to run Dynalite, connect it to Hyperbee, create tables, import tsv file, list and scan tables. 



1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
1. Navigate to dynalite directory
1. Install dependencies
1. Install AWS CLI or use any SDK
1. Configure AWS credentials (required to use AWS CLI)
1. Start server 
1. node dynalite-start.js
1. Try to connect and list tables using SDK (CLI will be used further)
1. node dynalite-connect.js
1. bash imdb-basics-create-table.sh
1. bash list-tables.sh
1. bash imdb-basics-download-tsv.sh
1. npm -g install import-csv-to-dynamo
1. bash imdb-basics-import-tsv.sh
1. bash scan-table.sh

Also we want to highlight that any dynamodb clients library can be used. Community developed a lot of them for any programming language. [**30-36**]


#### 	LinvoDB3

There is one more example of a powerful LevelDB compatible database which can be run on top of hyperbee and hyperbeedown. We applied the logically the same patch for LinvoDB3 as for Dynalite to work with hyperbee. See the dynalite [patch](https://github.com/mhart/dynalite/commit/aef9fa5040308d26aaca823fee3310cb4a721f87) and [PoC patch](https://github.com/SkySonR/linvodb3/commit/447cfe533175063e4fb8112b640f1ceffccf0d71) for linvodb3. It was done to show leveldb compatibility and explore LinvoDB3 functions. This database also works but some complex functions do not work (e.q map/reduce).  Basic functions like Insert / Save / Queuing works without code changes but require data transformation to ascii. Database itself is very powerful but seems like it is not supported anymore. 


## Kappa stack

Might be an alternative to Hyberbee, but there is a lot covered [here](https://github.com/kappa-db/workshop) with examples, explanations and practice. So we will not duplicate it. Will familiarize you with main concepts and provide few examples. 


### 	Multifeed	

It’s a core element of kappa architecture. With hypercore, there can only be one writer! Well, what if each user had their own hypercore? Then we could view their contents together to see all of the chat history as other people are writing. Module that lets you operate on a _set of hypercores_, and create a replication stream, in the same way that hypercore is replicated.

Multifeed lets you:



1. manage many hypercores, stored together
2. replicate a local set of hypercores with a remote set of hypercores 

It solves the problem of hypercore only allowing one writer by making it easy to manage and sync a set of hypercores by a variety of authors across peers. Replication works by extending the regular hypercore exchange mechanism to include a meta-exchange, where peers share information about the feeds they have locally, and choose which of the remote feeds they'd like to download in exchange. Right now, the replication mechanism defaults to sharing all local feeds and downloading all remote feeds.


##### Setup example



1. The following example will demonstrate how to be able to write not only from one node, but from any connected to the topic node.
    1. Clone [https://github.com/samostrovskyi/freeton-rtdb-research](https://github.com/samostrovskyi/freeton-rtdb-research) 
    2. Navigate to multifeed directory
    3. Install dependencies
    4. Review and run multifeed.js with an argument ‘1’ on the first VM, where ‘1’ is a random peer identifier
    5. Change data in multifeed.js, review and run multifeed.js with an argument ‘2’ on the first VM, where ‘2’ is a random peer identifier

    _Expected result_: you will see both written values on both VMs.



### Multifeed-index	

A multifeed is a set of append-only logs (feeds), with the property that only the feed's author can write new entries to it. One type of document that you might write to such a feed are key -> value pairs. Maybe documents looks like this:

{

_  id: '23482934',_

_  name: 'quinn',_

_  gender: null_

_}_

So some key, _'23482934'_, can map to this document. How could you make the lookup from _'23482934' _to the aforementioned document fast? What if there are thousands of such entries?	 You'd probably want to build some kind of index. One that iterates over every entry in every feed, and also listens for new entries that get added. Then you could create an efficient data structure (say, maybe with [level](https://github.com/Level/level)) that can map each key to a value quickly. Good news: this is essentially what [multifeed-index](https://github.com/kappa-db/multifeed-index) does!


###  	Kappa-core	

The twin concepts of _append-only logs_ and _materialized views_ are the key concepts of [kappa-core](https://github.com/kappa-db/kappa-core) built atop multifeed. Any kappa-core database does only a few things:



*   define various materialized views that it finds useful
*   write data to append-only logs
*   query those views to retrieve useful information

Like the traditional database, the table is mutated in-place to produce the new current state. The difference is that this table was _derived_ from immutable log data, instead of being the truth source itself.

Lastly, a kappa-core database is able to _replicate_ itself to another kappa-core database. The replicate API (below) returns a Node Duplex stream. This stream can operate over any stream-compatible transport medium, such as TCP, UTP, Bluetooth, a Unix pipe, or even audio waves sent over the air! When two kappa-core databases replicate, they exchange the logs and the entries in the logs, so that both sides end up with the same full set of log entries. This will trigger your database's materialized views to process these new entries to update themselves and reflect the latest state.


### 	Kappa-record-db	

A peer-to-peer database built on [hypercores](https://github.com/mafintosh/hypercore) and [kappa-core](https://github.com/kappa-db/kappa-core). See details [here](https://github.com/arso-project/kappa-record-db). Features:



*   Index a set of hypercores efficiently into materialized-view style secondary indexes
*   A simple and universal _record_ data model: Each record has an _id_, a _schema_, and a _value_.
*   Is developed for [Sonar](https://github.com/arso-project/sonar) which adds full-text search, binary assets, an HTTP API, a CLI and a UI.

Basically this means: put in json, optionally specify its JSON schema (for validation and uniformness), and sync effortlessly with other peers. A _database_ refers to a particular set of feeds. The current model starts with a single feed, and that feed then can add other feeds to the set of authorized sources. A second model, where all feeds that swarm under a shared key are considered authorized, will be added soon.

Internally, the database uses [unordered-materialized-kv](https://github.com/digidem/unordered-materialized-kv/) to have a shared notion of the latest versions of a record.


### 	Sonar

Sonar is an open source framework to manage, annotate, and full-text search through data including media files. It uses peer-to-peer technology to replicate and share collections. Sonar can be used to develop decentralized applications. See more in [docs](https://sonar.dev.arso.xyz/docs/) and [repo](https://github.com/arso-project/sonar).


## Test cases and benchmarks


### Hypercore



1. **Peers limit for single core**

In the first test scenario we execute a hypercore replication test which is run in the following environment: 

Hypercore “server” script writing 8000 entries every second... (32000 every 4000ms).  Hypercore “clients” script spawns 4 client every 4 seconds. We have tested up to 1000 connections to single writers to find a limit and understand stability.  This test aims to answer the question “How many peers can one writer serve?”. In this scenario all peers work only or almost only with writers because client peers don't have data to share.

Details:



*    hypercore “server” VM (x1):

        16 CPU


        32 RAM


        SSD


        1 Gbit network

*   hypercore clients VM (x6):

        1 CPU


        2 RAM


        SSD


        1 Gbit network

*   noise-network used for data encryption
*   all VMs geo-distributed across USA and Europe
*   all numbers were collected in the same timeframe (15 minutes) for each number of peers

All scripts to repeat the same tests can be found in the _hypercore/tests_ directory of the project repository.

**Results**






![image info](./pictures/image1.png)


**Conclusion**


When writer hypercore has ~ 300 active connections which independently replicate the all data the stability of protocol is good. With the increase of peers numbers a lot of clients receive timeout errors and try to reconnect. When writers have about 1000 writers which replicate the whole data the protocol starts working really unstable. We have tested this in case of using 2 VMs and 6 VMs which emulate the same amount of peers. Result looks pretty the same. Network bandwidth does not use more than 100 Mbit/s during tests / all processes have enough resources to run. So that's why we suppose that it’s protocol limitation **OR **we need to do specific configuration in protocol on server/clients sides (e.q increase timeout, etc). 



2. **Peers limit for multiple cores**

In the second scenario we want to test p2p replication and how it can change the situation. 

We have built the following environment. Hypercore “server” script writing 8000 entries every second... (32000 every 4000ms) but before the server starts we generate and replicate data also across 10 clients. We have run tests for 1000 peers to see differences and compare the results with the first test. 

**      Results**



![image info](./pictures/image2.png)


**       Conclusion**

We can see that in this case ~1000 connections works more stable compared to the first scenario. We can expect the same quantity of stabilization in case of using more and more synced nodes with increasing numbers of connected peers. 



3. **Relation between replicated data and peers limit**

We want to determine the existence of relation of writing data amounts to connected peer stability. To test it we repeated the test from the first scenario and changed the hypercore “server” script to writing 80000 entries every second... (320000 every 4000ms). 

**      Conclusion**

We receive pretty the same numbers. So the amount of generated data does not impact the amount of peers which one writer can serve. It’s only impact on time to full core replication and amount of memory which hypercore consumes. 



4. **Resource consumption**

    We have collected information regarding CPU / RAM / IO on server and clients VMs to estimate and understand requirements depending on data size and peers connected.


**       Results**

**_hypercore “server”_**


![image info](./pictures/image3.png)

During all tests CPU consumption on server VM almost exceeds 2 cores. Mean of Load Average: 1.81, 1.37, 1.04

**_hypercore clients_**

Each client which replicates data consumes about ~200 MB of RAM (increases overtime and depends on replicated data size) and 0.2 CPU. Mean of Load Average: 0.32, 0.20, 0.68 



5. **Storage allocation**

In the following scenario we will import 100000 lines file (7.6M) locally, estimate time and allocated storage after import. 


<table>
  <tr>
   <td>Name
   </td>
   <td>Time
   </td>
   <td>Allocated storage
   </td>
  </tr>
  <tr>
   <td>Hypercore
   </td>
   <td>real	0m1.047s
<p>
user	0m1.412s
<p>
sys	0m0.090s
   </td>
   <td>28M
   </td>
  </tr>
  <tr>
   <td>Multifeed
   </td>
   <td>real	0m10.867s
<p>
user	0m9.363s
<p>
sys	0m6.192s
   </td>
   <td>19M
   </td>
  </tr>
  <tr>
   <td>Kappa-core
   </td>
   <td>real	0m10.086s
<p>
user	0m8.884s
<p>
sys	0m5.749s
   </td>
   <td>23M
   </td>
  </tr>
  <tr>
   <td>Hyperbee
   </td>
   <td>real	0m18.532s
<p>
user	0m5.482s
<p>
sys	0m0.088s
   </td>
   <td>30M
   </td>
  </tr>
  <tr>
   <td>Multi-hyperbee
   </td>
   <td>real	1m59.733s
<p>
user	1m45.312s
<p>
sys	0m35.622s
   </td>
   <td>70M
   </td>
  </tr>
  <tr>
   <td>Dynalite
   </td>
   <td>                     -
   </td>
   <td>13M
   </td>
  </tr>
  <tr>
   <td>PouchDB
   </td>
   <td>                     -
   </td>
   <td>178M
   </td>
  </tr>
</table>


 

_Comments:_

**Multi-hyperbee. **Time is bigger because the batch is not supported yet. Also need to write to diff feed, what causes time delay and more storage required. But replication and remote queries work faster compared to other solutions.

**Dynalite**. The BatchWriteItem operation puts or deletes multiple items in one or more tables. A single call to BatchWriteItem can write up to 16 MB of data, which can comprise as many as 25 put or delete requests. Individual items to be written can be as large as 400 KB. Import data time depends on import script implementation. 

**PouchDB**. It’s the most powerful DB with a lot of features supported. So stored data is more prepared for use. Import data time depends on import script implementation. 


## Feature Comparison Matrix


<table>
  <tr>
   <td>
   </td>
   <td>Hypercore
   </td>
   <td>Multifeed
   </td>
   <td>Kappa-core
   </td>
   <td>Hyperbee
   </td>
   <td>Multi-Hyperbee
   </td>
   <td>Dynalite
   </td>
   <td>PouchDB
   </td>
  </tr>
  <tr>
   <td>sparse
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>batch support
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>authentication
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>network encryption
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>discovery
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>multi-writer support
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>Set of feeds
   </td>
   <td>
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>secondary indexes
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>map/reduce queries
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>server side scripts
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
  </tr>
  <tr>
   <td>transactions concept
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>revision marker
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>＋
   </td>
  </tr>
</table>



## Conclusion

Stack is designed with modularity in mind. You can pick and choose which modules you want to use in your P2P app. This brings flexibility to easily change hyperswarm-dht library to native FreeTON discovery method. 

During tests we discovered that Hypercore protocol can work efficiently only when there are at least several peers storing all the data needed to access by other peers. Otherwise the amount of peers accessing data without timeout error is pretty low.

We discovered two possible directions to implement the Free TON RTDB based on hypercore. The first one is kappa-core and the second one - Hyperbee. Hypebee stack provides compatibility with LevelDB which brings the ability to integrate it as a storage for well known production ready databases like Dynalite(DynamoDB compatible database) and PouchDB (Apache CouchDB open-source alternative). Because of that developers can easily adopt existing applications and use existing tools and libraries on different programming languages**[30-36]**. Kappa-core also looks well but forces developers to deeply understand the hypercore ecosystem and Kappa core API. 


##  References

	

[1] [https://hyperpy.decentral1.se/](https://hyperpy.decentral1.se/) 

[2] [https://datrs.yoshuawuyts.com/](https://datrs.yoshuawuyts.com/)

[3] [https://datcxx.github.io/](https://datcxx.github.io/)

[4] [https://github.com/hypercore-protocol/hypercore](https://github.com/hypercore-protocol/hypercore)

[5] [https://github.com/kappa-db/multifeed](https://github.com/kappa-db/multifeed)

[6] [https://github.com/kappa-db/multifeed-index](https://github.com/kappa-db/multifeed-index)

[7] [https://github.com/mafintosh/hyperdb](https://github.com/mafintosh/hyperdb)

[8] [https://github.com/genderev/assassin](https://github.com/genderev/assassin)

[9] [https://github.com/arso-project/kappa-record-db](https://github.com/arso-project/kappa-record-db)

[10] [https://github.com/arso-project/sonar](https://github.com/arso-project/sonar)

[11] [https://github.com/tradle/multi-hyperbee](https://github.com/tradle/multi-hyperbee) 

[12] [https://github.com/hypercore-protocol/p2p-indexing-and-search](https://github.com/hypercore-protocol/p2p-indexing-and-search)

[13] [https://noffle.github.io/kappa-arch-workshop/build/07b.html](https://noffle.github.io/kappa-arch-workshop/build/07b.html)

[14] [https://github.com/tradle/dynalite](https://github.com/tradle/dynalite)

[15] [https://github.com/tantivy-search/tantivy](https://github.com/tantivy-search/tantivy)

[16] [https://dazaar.com/whitepaper.pdf](https://dazaar.com/whitepaper.pdf) 

[17] [https://docs.cobox.cloud/welcome.html](https://docs.cobox.cloud/welcome.html)

[18] [https://github.com/yjs/yjs#Yjs-CRDT-Algorithm](https://github.com/yjs/yjs#Yjs-CRDT-Algorithm)

[19] [https://github.com/automerge/hypermerge](https://github.com/automerge/hypermerge)

[20] [https://github.com/automerge/automerge](https://github.com/automerge/automerge)

[21] [https://github.com/mafintosh/hypercore-multi-key](https://github.com/mafintosh/hypercore-multi-key)

[22] [https://github.com/tradle/why-hypercore/blob/master/FAQ.md](https://github.com/tradle/why-hypercore/blob/master/FAQ.md) 

[23] [https://github.com/pubkey/rxdb](https://github.com/pubkey/rxdb)

[24] [https://github.com/garbados/pouchdb-hypercore](https://github.com/garbados/pouchdb-hypercore)

[25] [https://github.com/Ivshti/linvodb3](https://github.com/Ivshti/linvodb3)

[26] [https://github.com/wparad/aws-dynamodb-performance-analysis](https://github.com/wparad/aws-dynamodb-performance-analysis)

[27] [https://github.com/alexdebrie/dynamodb-performance-testing](https://github.com/alexdebrie/dynamodb-performance-testing)

[28] [https://github.com/matwerber1/dynamodb-python-query-speed-test](https://github.com/matwerber1/dynamodb-python-query-speed-test)

[29] [https://github.com/luckyjazzbo/dynamodb-performance-test](https://github.com/luckyjazzbo/dynamodb-performance-test)

[30] [https://pynamodb.readthedocs.io/en/latest/](https://pynamodb.readthedocs.io/en/latest/)

[31] [https://github.com/yfilali/graphql-pynamodb](https://github.com/yfilali/graphql-pynamodb)

[32] [https://github.com/guregu/dynamo](https://github.com/guregu/dynamo)

[33] [https://github.com/Dynamoid/dynamoid](https://github.com/Dynamoid/dynamoid)

[34] [https://github.com/baopham/laravel-dynamodb](https://github.com/baopham/laravel-dynamodb)

[35] [https://github.com/freshollie/jest-dynalite](https://github.com/freshollie/jest-dynalite)

[36] [https://github.com/ClearcodeHQ/pytest-dynamodb](https://github.com/ClearcodeHQ/pytest-dynamodb)

[37] [https://github.com/HENNGE/aiodynamo](https://github.com/HENNGE/aiodynamo)

[38] [https://github.com/ssbc/ssb-server](https://github.com/ssbc/ssb-server)

[39] [https://github.com/ssbc/ssb-db](https://github.com/ssbc/ssb-db)

[40] [https://github.com/datproject/awesome-dat](https://github.com/datproject/awesome-dat)

[41] [https://sites.google.com/view/sexy-p2p/](https://sites.google.com/view/sexy-p2p/)

[42] [https://awesomeopensource.com/project/croqaz/awesome-decentralized](https://awesomeopensource.com/project/croqaz/awesome-decentralized)

[43] [https://github.com/kgryte/awesome-peer-to-peer](https://github.com/kgryte/awesome-peer-to-peer)

[44] [https://github.com/retrohacker/awesome-p2p](https://github.com/retrohacker/awesome-p2p)

[45] [https://github.com/andrewosh/hyperbeedown](https://github.com/andrewosh/hyperbeedown) 

[46] [https://github.com/mafintosh/noise-network](https://github.com/mafintosh/noise-network)
