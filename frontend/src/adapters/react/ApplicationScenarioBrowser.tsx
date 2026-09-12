import type { StudioSelection } from "./StudioHome";
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
  studioSelection?: StudioSelection;
  studioQuery?: string;
  onStudioQueryChange?: (value: string) => void;
};

export function ApplicationScenarioBrowser({
  library,
  catalog,
  mode,
  scenarioId,
  recipeId, studioQuery, onStudioQueryChange, studioSelection
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
          studioSelection={studioSelection}
          query={studioQuery}
          onQueryChange={onStudioQueryChange}
        />
      )}
    </section>
  );
}
