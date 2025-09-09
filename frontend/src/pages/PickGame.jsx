import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import teamColors from "../utils/teamColors";
import "../styles/PickGame.css";

export default function PickGame() {
  const { weekId, code } = useParams();
  const [weekData, setWeekData] = useState(null);
  const [currentGame, setCurrentGame] = useState(0);
  const [picks, setPicks] = useState([]);
  const [animState, setAnimState] = useState("enter"); // "enter" | "exit"
  const [showSparks, setShowSparks] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/week/${weekId}`)
      .then((res) => res.json())
      .then(setWeekData)
      .catch((err) => console.error(err));
  }, [weekId]);

  // Trigger sparks after panels slide in
  useEffect(() => {
    if (animState === "enter") {
      const timer = setTimeout(() => setShowSparks(true), 600); // panels collide
      const clear = setTimeout(() => setShowSparks(false), 1300); // hide sparks
      return () => {
        clearTimeout(timer);
        clearTimeout(clear);
      };
    }
  }, [animState]);

  function handlePick(team) {
    // add pick
    const newPick = { game_id: currentGame, team };
    const updatedPicks = [...picks, newPick];
    setPicks(updatedPicks);

    // trigger exit animation
    setAnimState("exit");

    // after exit animation ends, go to next game or confirm
    setTimeout(() => {
      if (currentGame + 1 < weekData.games.length) {
        setCurrentGame((prev) => prev + 1);
        setAnimState("enter"); // reset for new game
      } else {
        navigate(`/pick/confirm/${weekId}/${code}`, {
          state: { picks: updatedPicks },
        });
      }
    }, 600); // match CSS duration
  }

  if (!weekData) return <p>Loading week...</p>;

  const game = weekData.games[currentGame];
  const awayColor = teamColors[game.away] || "#555";
  const homeColor = teamColors[game.home] || "#333";

  return (
    <div className="pickgame-container">
      <div
        key={`${currentGame}-away-${animState}`}
        className={`team-panel away ${animState}`}
        style={{ backgroundColor: awayColor }}
        onClick={() => handlePick(game.away)}
      >
        <span className="team-name">{game.away}</span>
      </div>
      <div
        key={`${currentGame}-home-${animState}`}
        className={`team-panel home ${animState}`}
        style={{ backgroundColor: homeColor }}
        onClick={() => handlePick(game.home)}
      >
        <span className="team-name">{game.home}</span>
      </div>

      {showSparks && (
        <>
           <div className="effect-sparks left" />
           <div className="effect-sparks right mirrored" />
        </>
      )}
    </div>
  );
}
