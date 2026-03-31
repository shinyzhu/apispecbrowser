import { useState, useCallback, useMemo } from "react";
import type { OpenAPISpec, NavItem, ViewTarget } from "./types";
import { parseSpecFromUrl, parseSpecFromText, buildNavItems, buildSchemaRelationships } from "./utils/parseSpec";
import SpecLoader from "./components/SpecLoader";
import Sidebar from "./components/Sidebar";
import InfoViewer from "./components/InfoViewer";
import EndpointViewer from "./components/EndpointViewer";
import SchemaViewer from "./components/SchemaViewer";
import SchemaHierarchyViewer from "./components/SchemaHierarchyViewer";
import "./App.css";

function viewTargetToId(target: ViewTarget): string {
  switch (target.kind) {
    case "info":
      return "info";
    case "endpoint":
      return `endpoint-${target.method}-${target.path}`;
    case "schema":
      return `schema-${target.name}`;
    case "schema-hierarchy":
      return "schema-hierarchy";
  }
}

function App() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [activeView, setActiveView] = useState<ViewTarget>({ kind: "info" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSpecLoaded = useCallback((parsedSpec: OpenAPISpec) => {
    setSpec(parsedSpec);
    setNavItems(buildNavItems(parsedSpec));
    setActiveView({ kind: "info" });
    setError(null);
    setSearchQuery("");
  }, []);

  const handleLoadFromUrl = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      try {
        const parsed = await parseSpecFromUrl(url);
        handleSpecLoaded(parsed);
      } catch (err) {
        setError(
          `Failed to load spec from URL: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [handleSpecLoaded]
  );

  const handleLoadFromFile = useCallback(
    async (content: string) => {
      setLoading(true);
      setError(null);
      try {
        const parsed = await parseSpecFromText(content);
        handleSpecLoaded(parsed);
      } catch (err) {
        setError(
          `Failed to parse spec file: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [handleSpecLoaded]
  );

  const handleReset = useCallback(() => {
    setSpec(null);
    setNavItems([]);
    setActiveView({ kind: "info" });
    setError(null);
    setSearchQuery("");
  }, []);

  const schemaNodes = useMemo(
    () => (spec ? buildSchemaRelationships(spec) : []),
    [spec]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title" onClick={spec ? handleReset : undefined} style={spec ? { cursor: "pointer" } : undefined}>
          API Spec Browser
        </h1>
        {spec && (
          <span className="loaded-spec-name">{spec.info.title}</span>
        )}
      </header>

      {!spec ? (
        <main className="welcome">
          <div className="welcome-content">
            <h2>Browse OpenAPI Specifications</h2>
            <p>Load an OpenAPI spec file to explore its endpoints, schemas, and data structures.</p>
            <SpecLoader
              onLoadFromUrl={handleLoadFromUrl}
              onLoadFromFile={handleLoadFromFile}
              loading={loading}
              error={error}
            />
          </div>
        </main>
      ) : (
        <div className="app-body">
          <Sidebar
            items={navItems}
            activeId={viewTargetToId(activeView)}
            onSelect={setActiveView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <main className="content">
            {activeView.kind === "info" && <InfoViewer spec={spec} />}
            {activeView.kind === "endpoint" && (
              <EndpointViewer
                spec={spec}
                method={activeView.method}
                path={activeView.path}
              />
            )}
            {activeView.kind === "schema" && (
              <SchemaViewer spec={spec} schemaName={activeView.name} />
            )}
            {activeView.kind === "schema-hierarchy" && (
              <SchemaHierarchyViewer
                schemaNodes={schemaNodes}
                onSelect={setActiveView}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
