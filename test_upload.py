import requests
import json
import os

base_url = 'http://localhost:8080/api'

# 1. Register or login
creds = {'email': 'test@test.com', 'password': 'password'}
res = requests.post(f'{base_url}/auth/register', json=creds)
if res.status_code != 200:
    res = requests.post(f'{base_url}/auth/login', json=creds)

token = res.json().get('token')
print(f'Token: {token}')

# 2. Upload
dummy_file = 'dummy.wav'
with open(dummy_file, 'wb') as f:
    f.write(b'dummy audio content')

headers = {'Authorization': f'Bearer {token}'}
files = {'audioFile': (dummy_file, open(dummy_file, 'rb'), 'audio/wav')}

upload_res = requests.post(f'{base_url}/notes/upload', headers=headers, files=files)
print(f'Status: {upload_res.status_code}')
print(f'Response: {upload_res.text}')
