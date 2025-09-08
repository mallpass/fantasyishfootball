import { useEffect, useState } from "react";
import GridTable from "../components/GridTable";
import { Link } from "react-router-dom";

export default function Landing() {
  const [data, setData] = useState(null);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/grid")
    .then((res) => res.json())
    .then((json) => {
      console.log("Fetched data:", json); 
      setData(json);
    })
    .catch((err) => console.error("Fetch error:", err));
}, []);

  if (!data) return <p>Loading grid...</p>;

   return (
    <div>
      <h1>NFL Picks</h1>
      <GridTable weeks={data.weeks} grid={data.grid} />

      <div style={{ marginTop: "1rem" }}>
        <Link to="/pick">
          <button style={{ padding: "10px 20px", fontSize: "16px" }}>
            Make Picks
          </button>
        </Link>
      </div>
    </div>
  );
}
