import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";  // 添加这一行

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
