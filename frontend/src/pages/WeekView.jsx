import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function WeekView() {
  const { weekId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/week/${weekId}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, [weekId]);

  if (!data) return <p>Loading week {weekId}...</p>;

  // get unique members in this week's picks
  const members = [...new Set(data.picks.map((p) => p.member))];

  return (
    <div>
      <h2>Week {data.week_number}</h2>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Member</th>
            {data.games.map((g, idx) => (
              <th key={idx}>
                {g.away} @ {g.home}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member}>
              <td>{member}</td>
              {data.games.map((g, idx) => {
                const pick = data.picks.find(
                  (p) => p.member === member && p.game_id === idx
                );
                return <td key={idx}>{pick ? pick.team : "-"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
