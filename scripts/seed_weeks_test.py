import json
import os
from supabase import create_client
from dotenv import load_dotenv

# load Supabase creds from .env (reuse backend/.env)
load_dotenv(dotenv_path="../backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# read weeks.json
with open("../supabase/week1.json", "r") as f:
    weeks = json.load(f)

for week in weeks:
    resp = supabase.table("weeks_test").insert(week).execute()
    print(f"Inserted test week {week['week_number']}: {resp.data}")

