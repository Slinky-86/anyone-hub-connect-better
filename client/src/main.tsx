import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Providers } from "./lib/providers";

createRoot(document.getElementById("root")!).render(
  <Providers>
    <App />
  </Providers>
);
