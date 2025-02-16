#!/bin/env python3

import base64
import requests
import sys
import enum


class FileType(enum.Enum):
    FOLDER = "folder"
    FILE = "file"
    IMAGE = "image"


# upload image file
base_url = "http://0.0.0.0:5000"
file_path = sys.argv[2]
parentId = sys.argv[3] if sys.argv[3] and sys.argv[3] != "0" else None
file_name = file_path.split("/")[-1]
file_encoded = None
file_type = FileType.__dict__.get("_value2member_map_").get(sys.argv[1]).value

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

print("auth token: ", token)
if not token:
    print("You are not authenticated, please run the login script to authenticate")
    sys.exit(1)

if file_type is None:
    print("File type not supported")
    sys.exit(1)

if file_type == FileType.FOLDER.value:
    r_json = {
        "name": file_name,
        "type": file_type,
        "isPublic": True,
        "data": file_encoded,
        "parentId": parentId,
    }
else:
    with open(file_path, "rb") as localFile:
        file_encoded = base64.b64encode(localFile.read()).decode("utf-8")

    r_json = {
        "name": file_name,
        "type": file_type,
        "isPublic": True,
        "data": file_encoded,
        "parentId": parentId,
    }

r_headers = {"X-Token": f"auth_{token}"}

try:
    r = requests.post(f"{base_url}/files", json=r_json, headers=r_headers)
    data = r.json()
except Exception as e:
    print(e)
    sys.exit(1)
else:
    print(data)
