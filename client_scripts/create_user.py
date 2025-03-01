#!/bin/env python3

import requests
import sys


base_url = "http://0.0.0.0:5000"

if len(sys.argv) < 3:
    print("Usage: ./create_user.py <email> <password>")
    sys.exit()

email = sys.argv[1]
password = sys.argv[2]

r_json = {"email": email, "password": password}

try:
    r = requests.post(f"{base_url}/users", json=r_json)
    data = r.json()
except Exception as e:
    print(e)
    sys.exit(1)
else:
    print(data)
