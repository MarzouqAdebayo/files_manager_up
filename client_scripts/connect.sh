#!/bin/env bash

if ! command -v jq 2>&1 >/dev/null; then
  echo "jq is not installed; jq is needed to parse json output"
  exit 1
fi

email=$1
password=$2
if [ "$#" -ne 2 ];then
  echo "Usage: $0 <email> <password>"
  exit 1
fi

login_details="$email:$password"
base_url="0.0.0.0:5000"

auth_encoded=$(printf '%s' $login_details | base64)

response=$(curl -XGET -s "$base_url/connect" -H "Accept: application/json" -H "Authorization: Basic ${auth_encoded}")

error=$(jq -r '.error' <<<"$response")
if [ -z "$error" ]
then
  echo "$response"
  exit 1
fi

token=$(jq -r '.token' <<<"$response")
echo "/tmp/token"

touch "/tmp/token"
echo "$token" > "/tmp/token"
