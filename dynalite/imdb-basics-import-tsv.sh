#!/bin/bash

file='title.basics'

echo '"tconst (S)","titleType (S)","primaryTitle (S)","originalTitle (S)","isAdult (S)","startYear (S)","endYear (S)","runtimeMinutes (S)","genres (S)"' > $file.csv

tsv_length=$(wc -l $file.tsv | cut -d ' ' -f1)

while [ $tsv_length -gt 0 ]
do
  head -n 25 $file.tsv | sed 's/,/ /g' | sed 's/"//g' | sed 's/\t/,/g' | sed 's/,/","/g' | sed 's/^/"/g' | sed 's/$/"/g' >> $file.csv
  import-csv-to-dynamo -t imdb-basics $file.csv
  sed -i '1,25d' $file.tsv
  sed -i '2,26d' $file.csv
  tsv_length=$(wc -l $file.tsv | cut -d ' ' -f1)
done

rm $file.csv
