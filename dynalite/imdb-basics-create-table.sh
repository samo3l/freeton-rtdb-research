#!/bin/bash

aws dynamodb --endpoint-url http://localhost:8000 create-table \
--attribute-definitions AttributeName=tconst,AttributeType=S AttributeName=titleType,AttributeType=S \
--table-name imdb-basics \
--key-schema AttributeName=tconst,KeyType=HASH AttributeName=titleType,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
