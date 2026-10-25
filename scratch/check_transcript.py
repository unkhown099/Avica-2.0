import json
import re

transcript_path = r'C:\Users\Welcome\.gemini\antigravity\brain\19cb5dce-6337-480a-8695-468f707b7836\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        c = str(d.get('content', ''))
        t = str(d.get('thinking', ''))
        for term in ['EmployeeDashboard', 'login', 'credentials', 'password']:
            if term in c or term in t:
                # check if there are credentials mentioned
                for m in re.finditer(r'[\w\.-]+@[\w\.-]+', c + ' ' + t):
                    email = m.group(0)
                    if 'avica' in email or 'gmail' in email:
                        print(f"Step {d.get('step_index')}: email={email}")
                break

