#!/bin/env python3

import base64
import requests
import sys
import os

base_url = "http://0.0.0.0:5000"

# login
login_details = sys.argv[1]
auth_encoded = base64.b64encode(login_details.encode(encoding="utf-8")).decode("utf-8")
auth_headers = {"Authorization": f"Basic {auth_encoded}"}
try:
    r = requests.get(f"{base_url}/connect", headers=auth_headers)
    data = r.json()
except Exception as e:
    print(e)
    sys.exit(1)
else:
    token = data.get("token")
    os.putenv("FILE_MANAGER_TOKEN", token)

try:
    token = os.getenv("FILE_MANAGER_TOKEN")
    print(token)
except Exception:
    print("You are not authenticated, please run the login script to authenticate")
    sys.exit(1)
