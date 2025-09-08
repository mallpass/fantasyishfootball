import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import WeekView from "./pages/WeekView";
import PickAuth from "./pages/PickAuth";
import PickGame from "./pages/PickGame";
import PickConfirm from "./pages/PickConfirm";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/week/:weekId" element={<WeekView />} />
      <Route path="/pick" element={<PickAuth />} />
      <Route path="/pick/week/:weekId/:code" element={<PickGame />} />
      <Route path="/pick/confirm/:weekId/:code" element={<PickConfirm />} />
    </Routes>
  </BrowserRouter>
);
