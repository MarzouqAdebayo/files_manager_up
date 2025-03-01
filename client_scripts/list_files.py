#!/bin/env python3

import requests
import sys


if len(sys.argv) < 1:
    print("Requires: singular endpoint? yes / no")
singular_endpoint = sys.argv[1]

file_id = ""
if singular_endpoint == "yes":
    try:
        file_id = f"/{sys.argv[2]}" if sys.argv[2] else ""
    except Exception:
        pass

if singular_endpoint != "yes":
    query_params = {"parentId": 0, "page": 1}
    try:
        query_params["parentId"] = sys.argv[2]
    except Exception:
        pass
    try:
        query_params["page"] = sys.argv[3]
    except Exception:
        pass
    paramsObject = "&".join([f"{key}={query_params[key]}" for key in query_params])
    file_id = f"{file_id}?{paramsObject}"

base_url = "http://0.0.0.0:5000"
try:
    with open("/tmp/token", "r") as tokenFile:
        token = tokenFile.readline()
except Exception as e:
    print(e)
    print("You are not authenticated, please run the login script to authenticate")
    sys.exit(1)
else:
    token = token.split("\n")[0]
    print(token)

if not token:
    print("You are not authenticated, please run the login script to authenticate")
    sys.exit(1)

r_headers = {"X-Token": f"auth_{token}"}
final_url = f"{base_url}/files{file_id}"
print(final_url)
try:
    r = requests.get(final_url, headers=r_headers)
    data = r.json()
except Exception as e:
    print(e)
    sys.exit(1)
else:
    print(data)
