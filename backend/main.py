import os, requests
from fastapi import FastAPI
from supabase import create_client
from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from datetime import datetime, time, timedelta, timezone

from pydantic import BaseModel
from typing import List

MST = timezone(timedelta(hours=-7))

class Pick(BaseModel):
    game_id: int
    team: str

class SubmitPicksRequest(BaseModel):
    member_code: str
    week_id: int
    picks: List[Pick]

# load .env file
load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# read env vars
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/members")
def get_members():
    resp = supabase.table("family_members").select("*").execute()
    return resp.data

@app.post("/add_member")
def add_member(name: str, code: str):
    resp = supabase.table("family_members").insert(
        {"name": name, "code": code}
    ).execute()
    return resp.data

@app.post("/submit_pick")
def submit_pick(member_code: str, week_id: int, game_id: int, team: str):
    # find member by code
    member_resp = supabase.table("family_members").select("id").eq("code", member_code).execute()
    if not member_resp.data:
        raise HTTPException(status_code=404, detail="Invalid member code")

    member_id = member_resp.data[0]["id"]

    # insert pick
    pick = {
        "week_id": week_id,
        "member_id": member_id,
        "game_id": game_id,
        "team": team
    }

    resp = supabase.table("picks").insert(pick).execute()

    return resp.data

@app.get("/week/{week_id}")
def get_week(week_id: int):
    # get the week info (games JSON)
    week_resp = supabase.table("weeks").select("*").eq("id", week_id).execute()
    if not week_resp.data:
        raise HTTPException(status_code=404, detail="Week not found")
    week = week_resp.data[0]

    # get all picks for this week
    picks_resp = supabase.table("picks").select("member_id, game_id, team").eq("week_id", week_id).execute()

    # map member IDs → names
    members_resp = supabase.table("family_members").select("id, name").execute()
    members = {m["id"]: m["name"] for m in members_resp.data}

    # combine data
    picks = [
        {
            "member": members[p["member_id"]],
            "game_id": p["game_id"],
            "team": p["team"]
        }
        for p in picks_resp.data
    ]

    return {
        "week_number": week["week_number"],
        "games": week["games"],
        "picks": picks
    }


@app.get("/grid")
def get_grid():
    # Get weeks
    weeks_resp = supabase.table("weeks").select("id, week_number").order("week_number").execute()
    weeks = weeks_resp.data
    week_ids = {w["id"]: w["week_number"] for w in weeks}

    # Get members
    members_resp = supabase.table("family_members").select("id, name").execute()
    members = members_resp.data

    # Get picks
    picks_resp = supabase.table("picks").select("member_id, week_id, game_id, team").execute()
    picks = picks_resp.data

    # Get results
    results_resp = supabase.table("results").select("week_id, game_id, winner").execute()
    results = results_resp.data

    # Build lookup for results
    results_lookup = {(r["week_id"], r["game_id"]): r["winner"] for r in results}

    # Initialize grid
    grid = []
    for m in members:
        scores = {str(week_ids[w["id"]]): 0 for w in weeks}
        # Count correct picks
        for p in picks:
            if p["member_id"] == m["id"]:
                key = (p["week_id"], p["game_id"])
                if key in results_lookup and results_lookup[key] == p["team"]:
                    scores[str(week_ids[p["week_id"]])] += 1
        grid.append({"member": m["name"], "scores": scores})

    return {"weeks": weeks, "grid": grid}


@app.get("/next_week")
def get_next_week():
    today = datetime.now(MST)

    weeks_resp = supabase.table("weeks").select("id, week_number, start_date, games").order("start_date").execute()
    for w in weeks_resp.data:
        start = datetime.fromisoformat(w["start_date"])
        cutoff = datetime.combine(start, time(22, 0), MST)  # 10:00 PM MST on start_date
        if today <= cutoff:
            return w

    raise HTTPException(status_code=404, detail="No upcoming week available")


@app.get("/can_pick/{member_code}")
def can_pick(member_code: str):
    # Find member
    member_resp = supabase.table("family_members").select("id").eq("code", member_code).execute()
    if not member_resp.data:
        raise HTTPException(status_code=404, detail="Invalid member code")
    member_id = member_resp.data[0]["id"]

    # Find next week
    week = get_next_week()
    week_id = week["id"]

    # Check if picks exist
    picks_resp = supabase.table("picks").select("id").eq("week_id", week_id).eq("member_id", member_id).execute()
    already = len(picks_resp.data) > 0

    return {
        "allowed": not already,
        "week_id": week_id,
        "week_number": week["week_number"],
    }

@app.post("/submit_picks")
def submit_picks(req: SubmitPicksRequest):
    # Find member
    member_resp = supabase.table("family_members").select("id").eq("code", req.member_code).execute()
    if not member_resp.data:
        raise HTTPException(status_code=404, detail="Invalid member code")
    member_id = member_resp.data[0]["id"]

    # Insert all picks
    rows = [
        {"week_id": req.week_id, "member_id": member_id, "game_id": p.game_id, "team": p.team}
        for p in req.picks
    ]

    resp = supabase.table("picks").insert(rows).execute()

    return {"inserted": len(resp.data), "week_id": req.week_id}


@app.post("/sync_results/{week_id}")
def sync_results(week_id: int):
    # 1. Get week info from DB
    week_resp = supabase.table("weeks").select("id, week_number, games").eq("id", week_id).execute()
    if not week_resp.data:
        raise HTTPException(status_code=404, detail="Week not found")
    week = week_resp.data[0]

    week_number = week["week_number"]

    # 2. Call ESPN scoreboard
    url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    params = {
        "seasontype": 2,  # regular season
        "week": week_number,
        "dates": 2025     # season year
    }
    r = requests.get(url, params=params)
    r.raise_for_status()
    data = r.json()

    inserted = []
    for game_id, scheduled in enumerate(week["games"]):
        # Find matching ESPN event
        event = None
        for ev in data.get("events", []):
            comp = ev["competitions"][0]
            teams = {c["team"]["abbreviation"]: c for c in comp["competitors"]}
            if scheduled["home"] in teams and scheduled["away"] in teams:
                event = comp
                break
        if not event:
            continue

        # Only process completed games
        if not event["status"]["type"].get("completed", False):
            continue

        home = next(c for c in event["competitors"] if c["homeAway"] == "home")
        away = next(c for c in event["competitors"] if c["homeAway"] == "away")

        winner = home["team"]["abbreviation"] if home.get("winner") else away["team"]["abbreviation"]

        row = {
            "week_id": week_id,
            "game_id": game_id,
            "winner": winner,
            "home_score": int(home["score"]),
            "away_score": int(away["score"]),
        }

        # Insert into Supabase (ignore if already exists)
        resp = supabase.table("results_test").insert(row).execute()
        inserted.append(resp.data[0])

    return {"synced": len(inserted), "results": inserted}

@app.post("/sync_results_test/{week_id}")
def sync_results(week_id: int):
    # 1. Get week info from DB
    week_resp = supabase.table("weeks_test").select("id, week_number, games").eq("id", week_id).execute()
    if not week_resp.data:
        raise HTTPException(status_code=404, detail="Week not found")
    week = week_resp.data[0]

    week_number = week["week_number"]

    # 2. Call ESPN scoreboard
    url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    params = {
        "seasontype": 2,  # regular season
        "week": week_number,
        "dates": 2025     # season year
    }
    r = requests.get(url, params=params)
    r.raise_for_status()
    data = r.json()

    inserted = []
    for game_id, scheduled in enumerate(week["games"]):
        # Find matching ESPN event
        event = None
        for ev in data.get("events", []):
            comp = ev["competitions"][0]
            teams = {c["team"]["abbreviation"]: c for c in comp["competitors"]}
            if scheduled["home"] in teams and scheduled["away"] in teams:
                event = comp
                break
        if not event:
            continue

        # Only process completed games
        if not event["status"]["type"].get("completed", False):
            continue

        home = next(c for c in event["competitors"] if c["homeAway"] == "home")
        away = next(c for c in event["competitors"] if c["homeAway"] == "away")

        winner = home["team"]["abbreviation"] if home.get("winner") else away["team"]["abbreviation"]

        row = {
            "week_id": week_id,
            "game_id": game_id,
            "winner": winner,
            "home_score": int(home["score"]),
            "away_score": int(away["score"]),
        }

        # Insert into Supabase (ignore if already exists)
        resp = supabase.table("results_test").insert(row).execute()

        inserted.append(resp.data[0])

    return {"synced": len(inserted), "results": inserted}
