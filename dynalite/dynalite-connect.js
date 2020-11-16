var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'});

var dynamo = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' })

dynamo.listTables(console.log.bind(console))
