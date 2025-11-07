import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { authorizedFetch } from "@/lib/queryClient";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo, init?: RequestInit) => {
    // Use original fetch for non-HTTP schemes to avoid issues
    if (typeof input === "string" && !/^https?:/i.test(input) && !input.startsWith("/")) {
      return originalFetch(input, init);
    }
    return authorizedFetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
