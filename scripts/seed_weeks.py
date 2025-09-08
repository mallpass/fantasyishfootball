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
with open("../supabase/weeks.json", "r") as f:
    weeks = json.load(f)

for week in weeks:
    # insert each week into Supabase
    resp = supabase.table("weeks").insert(week).execute()
    print(f"Inserted week {week['week_number']}: {resp.data}")
