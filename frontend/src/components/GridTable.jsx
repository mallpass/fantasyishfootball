import { Link } from "react-router-dom";

export default function GridTable({ weeks, grid }) {
  return (
    <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Member</th>
          {weeks.map((week) => (
            <th key={week.id}>
              <Link to={`/week/${week.id}`}>Week {week.week_number}</Link>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grid.map((row) => (
          <tr key={row.member}>
            <td>{row.member}</td>
            {weeks.map((week) => (
              <td key={week.id}>{row.scores[week.week_number]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
