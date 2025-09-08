import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function PickGame() {
  const { weekId, code } = useParams();
  const [weekData, setWeekData] = useState(null);
  const [currentGame, setCurrentGame] = useState(0);
  const [picks, setPicks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/week/${weekId}`)
      .then((res) => res.json())
      .then(setWeekData)
      .catch((err) => console.error(err));
  }, [weekId]);

  function handlePick(team) {
  const newPick = { game_id: currentGame, team };
  const updatedPicks = [...picks, newPick];   // build it here
  setPicks(updatedPicks);

  if (currentGame + 1 < weekData.games.length) {
    setCurrentGame(currentGame + 1);
  } else {
    // all games picked → move to confirm page with updated picks
    navigate(`/pick/confirm/${weekId}/${code}`, { state: { picks: updatedPicks } });
  }
}

  if (!weekData) return <p>Loading week...</p>;

  const game = weekData.games[currentGame];

  return (
    <div>
      <h2>Week {weekData.week_number} Picks</h2>
      <h3>
        Game {currentGame + 1} of {weekData.games.length}
      </h3>
      <p>
        {game.away} @ {game.home}
      </p>
      <button onClick={() => handlePick(game.away)}>{game.away}</button>
      <button onClick={() => handlePick(game.home)}>{game.home}</button>
    </div>
  );
}
