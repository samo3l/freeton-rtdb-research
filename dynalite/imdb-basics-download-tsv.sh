#!/bin/bash

file='title.basics'

wget https://datasets.imdbws.com/$file.tsv.gz
gzip -d $file.tsv.gz
sed -i '1d' $file.tsv
