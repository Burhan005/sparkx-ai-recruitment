import urllib.request
import json

def api_post(url, data, headers=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json', **(headers or {})}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def api_patch(url, data, headers=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json', **(headers or {})}, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def api_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

status, login_res = api_post('http://127.0.0.1:8000/api/auth/login', {'email': 'admin@sparkx.ai', 'password': 'sparkx2026'})
token = login_res.get('token')
headers = {'Authorization': f'Bearer {token}'}

status, cands = api_get('http://127.0.0.1:8000/api/candidates', headers)
target = cands[0]
print(f"Testing Candidate: {target['name']} (ID: {target['id']}, initial status: {target.get('status')})")

status, move_res = api_patch(f"http://127.0.0.1:8000/api/candidates/{target['id']}/status", {'status': 'Applied'}, headers)
print("Status update response:", status, move_res)

status, updated = api_get(f"http://127.0.0.1:8000/api/candidates/{target['id']}", headers)
print("Candidate status after move:", updated.get('status'))
print("Candidate final_decision after move:", updated.get('final_decision'))
print("Candidate interview_status after move:", updated.get('interview_status'))

assert updated.get('status') == 'Applied', 'Status should be Applied'
assert updated.get('final_decision') == 'Applied', 'Final decision should be Applied'
print("VERIFICATION SUCCEEDED: Candidate successfully moved to Applied in backend!")
