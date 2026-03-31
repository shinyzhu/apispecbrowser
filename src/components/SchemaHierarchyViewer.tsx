import { useState } from "react";
import type { SchemaNode, SchemaRelationship, ViewTarget } from "../types";

interface SchemaHierarchyViewerProps {
  schemaNodes: SchemaNode[];
  onSelect: (target: ViewTarget) => void;
}

function relationLabel(rel: SchemaRelationship): string {
  switch (rel.relationType) {
    case "property":
      return rel.property;
    case "array-item":
      return `${rel.property}[]`;
    case "allOf":
      return "extends";
    case "oneOf":
      return "oneOf";
    case "anyOf":
      return "anyOf";
  }
}

function SchemaTreeNode({
  node,
  allNodes,
  onSelect,
  expanded,
  onToggle,
  visited,
}: {
  node: SchemaNode;
  allNodes: Map<string, SchemaNode>;
  onSelect: (target: ViewTarget) => void;
  expanded: Set<string>;
  onToggle: (name: string) => void;
  visited: Set<string>;
}) {
  const hasRels = node.relationships.length > 0;
  const isExpanded = expanded.has(node.name);

  return (
    <div className="hierarchy-node">
      <div className="hierarchy-node-header">
        {hasRels ? (
          <button
            className="hierarchy-toggle"
            onClick={() => onToggle(node.name)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="hierarchy-toggle-placeholder" />
        )}
        <button
          className="hierarchy-node-name"
          onClick={() => onSelect({ kind: "schema", name: node.name })}
          title={`View ${node.name} schema`}
        >
          {node.name}
        </button>
        {hasRels && (
          <span className="hierarchy-rel-count">
            {node.relationships.length} ref{node.relationships.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {isExpanded && hasRels && (
        <ul className="hierarchy-children">
          {node.relationships.map((rel, i) => {
            const childNode = allNodes.get(rel.targetSchema);
            const isCyclic = visited.has(rel.targetSchema);
            return (
              <li key={`${rel.property}-${rel.targetSchema}-${i}`} className="hierarchy-rel">
                <span className={`hierarchy-rel-label rel-${rel.relationType}`}>
                  {relationLabel(rel)}
                </span>
                <span className="hierarchy-arrow">→</span>
                {isCyclic ? (
                  <button
                    className="hierarchy-node-name cyclic"
                    onClick={() => onSelect({ kind: "schema", name: rel.targetSchema })}
                    title={`View ${rel.targetSchema} schema (circular reference)`}
                  >
                    {rel.targetSchema} ↻
                  </button>
                ) : childNode ? (
                  <SchemaTreeNode
                    node={childNode}
                    allNodes={allNodes}
                    onSelect={onSelect}
                    expanded={expanded}
                    onToggle={onToggle}
                    visited={new Set([...visited, node.name])}
                  />
                ) : (
                  <button
                    className="hierarchy-node-name"
                    onClick={() => onSelect({ kind: "schema", name: rel.targetSchema })}
                    title={`View ${rel.targetSchema} schema`}
                  >
                    {rel.targetSchema}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SchemaHierarchyViewer({
  schemaNodes,
  onSelect,
}: SchemaHierarchyViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const allNodes = new Map(schemaNodes.map((n) => [n.name, n]));

  function handleToggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(schemaNodes.map((n) => n.name)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  return (
    <div className="schema-hierarchy">
      <h2>Schema Hierarchy</h2>
      <p className="schema-hierarchy-desc">
        Explore how schemas relate to each other through property references and composition.
      </p>
      <div className="hierarchy-toolbar">
        <button className="hierarchy-btn" onClick={expandAll}>
          Expand All
        </button>
        <button className="hierarchy-btn" onClick={collapseAll}>
          Collapse All
        </button>
      </div>
      <div className="hierarchy-tree">
        {schemaNodes.map((node) => (
          <SchemaTreeNode
            key={node.name}
            node={node}
            allNodes={allNodes}
            onSelect={onSelect}
            expanded={expanded}
            onToggle={handleToggle}
            visited={new Set()}
          />
        ))}
      </div>
    </div>
  );
}
