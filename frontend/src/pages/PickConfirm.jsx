import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function PickConfirm() {
  const { weekId, code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // picks came from PickGame.jsx via location.state
  const [picks, setPicks] = useState(location.state?.picks || []);
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/week/${weekId}`)
      .then((res) => res.json())
      .then((data) => setGames(data.games))
      .catch((err) => console.error(err));
  }, [weekId]);

  function updatePick(gameId, newTeam) {
    setPicks((prev) =>
      prev.map((p) => (p.game_id === gameId ? { ...p, team: newTeam } : p))
    );
  }

  async function handleConfirm() {
    try {
      const res = await fetch("http://127.0.0.1:8000/submit_picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_code: code, week_id: parseInt(weekId), picks }),
      });

      if (res.ok) {
        alert("Picks submitted!");
        navigate("/"); // back to grid
      } else {
        const errData = await res.json();
        alert("Error: " + (errData.detail || "submission failed"));
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  }

  return (
    <div>
      <h2>Confirm Picks for Week {weekId}</h2>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Game</th>
            <th>Your Pick</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g, idx) => {
            const pick = picks.find((p) => p.game_id === idx);
            return (
              <tr key={idx}>
                <td>
                  {g.away} @ {g.home}
                </td>
                <td>{pick ? pick.team : "-"}</td>
                <td>
                  <select
                    value={pick?.team || ""}
                    onChange={(e) => updatePick(idx, e.target.value)}
                  >
                    <option value="">-- choose --</option>
                    <option value={g.away}>{g.away}</option>
                    <option value={g.home}>{g.home}</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={handleConfirm}>Confirm Picks</button>
    </div>
  );
}
