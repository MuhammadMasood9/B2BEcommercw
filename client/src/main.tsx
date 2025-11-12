import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import font and CSS optimization utilities
import "./utils/systemFontLoader";
import "./utils/cssOptimizer";
import "./utils/webVitalsMonitor";

createRoot(document.getElementById("root")!).render(<App />);
