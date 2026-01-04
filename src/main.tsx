import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch((err) => console.error("SW registration failed:", err));
}

createRoot(document.getElementById("root")!).render(<App />);
