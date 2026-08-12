import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import rawSnapshot from "virtual:workbench-snapshot";
import { App, InvalidSnapshot } from "./app/App";
import { isWorkbenchSnapshot, validateWorkbenchSnapshot } from "./core/guards";

const container = document.getElementById("root");
if (!container) throw new Error("Root element is missing");

const root = createRoot(container);
if (isWorkbenchSnapshot(rawSnapshot)) {
  root.render(
    <StrictMode>
      <App snapshot={rawSnapshot} />
    </StrictMode>
  );
} else {
  const issues = validateWorkbenchSnapshot(rawSnapshot);
  root.render(
    <StrictMode>
      <InvalidSnapshot messages={issues.map((issue) => issue.message)} />
    </StrictMode>
  );
}
