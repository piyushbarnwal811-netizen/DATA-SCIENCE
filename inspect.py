import re, os

def read_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

base = r'..\ExamGuard AI'
lockdown = read_file(os.path.join(base, 'frontend', 'src', 'js', 'lockdown.js'))
proctor = read_file(os.path.join(base, 'frontend', 'src', 'js', 'proctor_ai.js'))
admin_py = read_file(os.path.join(base, 'backend', 'app', 'api', 'admin.py'))
contest_py = read_file(os.path.join(base, 'backend', 'app', 'api', 'contest.py'))
tracking_py = read_file(os.path.join(base, 'backend', 'app', 'api', 'tracking.py'))

print("--- LOCKDOWN EVENTS ---")
for line in lockdown.splitlines():
    if "SECURITY_EVENT" in line or "logEvent" in line or "eventName" in line or "FULLSCREEN" in line or "TAB" in line or "DEVTOOLS" in line:
        print(" ", line.strip()[:100])

print("\n--- PROCTOR EVENTS ---")
for line in proctor.splitlines():
    if "AI_CHEAT_EVENTS" in line or "FACE" in line or "LOOKING" in line or "MULTIPLE" in line:
        print(" ", line.strip()[:100])

print("\n--- ADMIN ENDPOINTS ---")
for line in admin_py.splitlines():
    if "@router." in line:
        print(" ", line.strip())

print("\n--- CONTEST ENDPOINTS ---")
for line in contest_py.splitlines():
    if "@router." in line:
        print(" ", line.strip())
