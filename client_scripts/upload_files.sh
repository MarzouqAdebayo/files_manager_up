#!/bin/env bash

dir_path=$1
extension=$2
type=$3
parentId=$4

files=($(ls $1/*.$2))

for e in "${files[@]}";do
  echo "$3 $e $4"
  echo $(./client_scripts/upload_file.py "$3" "$e" "$4")  
  echo "uploaded file $e"
done
