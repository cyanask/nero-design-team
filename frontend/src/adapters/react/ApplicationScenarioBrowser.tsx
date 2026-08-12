import type { JSX } from "react";
import type { CapabilityLibraryVM } from "../../core/contracts";
import type { ApplicationScenarioCatalog } from "../../core/application-scenarios";
import { ApplicationScenarioIndex } from "./ApplicationScenarioIndex";
import { ApplicationSolutionDetail } from "./ApplicationSolutionDetail";

export type ApplicationScenarioBrowserProps = {
  library: CapabilityLibraryVM;
  catalog: ApplicationScenarioCatalog;
  mode: "index" | "scenario" | "solution";
  scenarioId: string | null;
  recipeId: string | null;
};

export function ApplicationScenarioBrowser({
  library,
  catalog,
  mode,
  scenarioId,
  recipeId
}: ApplicationScenarioBrowserProps): JSX.Element {
  return (
    <section className="scenario-browser" aria-label="应用场景浏览器">
      {mode === "solution" ? (
        <ApplicationSolutionDetail catalog={catalog} library={library} recipeId={recipeId} />
      ) : (
        <ApplicationScenarioIndex
          catalog={catalog}
          library={library}
          mode={mode}
          scenarioId={scenarioId}
        />
      )}
    </section>
  );
}
