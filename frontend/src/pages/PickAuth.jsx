import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PickAuth.css";

export default function PickAuth() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch(`http://127.0.0.1:8000/can_pick/${code}`);
      const data = await res.json();

      if (res.ok && data.allowed) {
        navigate(`/pick/week/${data.week_id}/${code}`);
      } else if (res.ok && !data.allowed) {
        setMessage("You already submitted picks for this week!");
      } else {
        setMessage(data.detail || "Error checking code");
      }
    } catch (err) {
      setMessage("Server error. Try again.");
      console.error(err);
    }
  }

  return (
    <div className="pick-auth">
      <h2>Enter Your Code</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          required
        />
        <button type="submit">Start Picking</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
