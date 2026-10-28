#!/usr/bin/env python3
"""Run one read query on a Supabase project via the Management API; print JSON rows.
Usage: SUPABASE_TOKEN=... sbq.py PROJECT_REF < query.sql"""
import json, os, sys, urllib.request
req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{sys.argv[1]}/database/query",
    data=json.dumps({"query": sys.stdin.read()}).encode(),
    headers={"Authorization": "Bearer " + os.environ["SUPABASE_TOKEN"], "Content-Type": "application/json"})
print(urllib.request.urlopen(req, timeout=120).read().decode())
