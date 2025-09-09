import { Link } from "react-router-dom";
import "../styles/GridTable.css";

export default function GridTable({ weeks, grid }) {
  // find max score per week
  const weekMax = {};
  weeks.forEach((week) => {
    weekMax[week.week_number] = Math.max(
      ...grid.map((row) => row.scores[week.week_number])
    );
  });

  // detect screen width
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile view → week cards (no "Weeks Won" column in mobile to keep it clean)
    return (
      <div>
        {weeks.map((week) => (
          <div key={week.id} className="week-card">
            <h3>
              <Link to={`/week/${week.id}`}>Week {week.week_number}</Link>
            </h3>
            <table>
              <tbody>
                {grid.map((row) => {
                  const score = row.scores[week.week_number];
                  const isWinner = score === weekMax[week.week_number] && score > 0;
                  return (
                    <tr key={row.member}>
                      <td>{row.member}</td>
                      <td className={isWinner ? "winner-cell" : ""}>{score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  // Desktop view → big grid table with Weeks Won column
  // Desktop view → big grid table with Weeks Won column
return (
  <table className="grid-table">
    <thead>
      <tr>
        <th>Member</th>
        {weeks.map((week) => (
          <th key={week.id}>
            <Link to={`/week/${week.id}`}>Week {week.week_number}</Link>
          </th>
        ))}
        <th>Weeks Won</th>
      </tr>
    </thead>
    <tbody>
      {grid.map((row) => {
        // count how many times this member was a winner
        const weeksWon = weeks.reduce((count, week) => {
          const score = row.scores[week.week_number];
          return count + (score === weekMax[week.week_number] && score > 0 ? 1 : 0);
        }, 0);

        return (
          <tr key={row.member}>
            <td>{row.member}</td>
            {weeks.map((week) => {
              const score = row.scores[week.week_number];
              const isWinner =
                score === weekMax[week.week_number] && score > 0;
              return (
                <td
                  key={week.id}
                  className={isWinner ? "winner-cell" : ""}
                >
                  {score}
                </td>
              );
            })}
            <td>{weeksWon}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

}
