import type { OpenAPISpec, NavItem, SchemaNode, SchemaRelationship } from "../types";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export async function parseSpecFromUrl(url: string): Promise<OpenAPISpec> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  return parseSpecFromText(text);
}

export async function parseSpecFromText(text: string): Promise<OpenAPISpec> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const yaml = await import("js-yaml");
    parsed = yaml.load(text);
  }
  const spec = parsed as OpenAPISpec;
  resolveRefs(spec, spec);
  return spec;
}

function resolveRefs(obj: unknown, root: unknown): void {
  if (obj === null || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i] as Record<string, unknown>;
      if (item && typeof item === "object" && "$ref" in item && typeof item["$ref"] === "string") {
        const resolved = resolveRef(item["$ref"], root);
        if (resolved !== undefined) {
          obj[i] = resolved;
        }
      } else {
        resolveRefs(item, root);
      }
    }
    return;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key] as Record<string, unknown>;
    if (value && typeof value === "object" && "$ref" in value && typeof value["$ref"] === "string") {
      const resolved = resolveRef(value["$ref"], root);
      if (resolved !== undefined) {
        record[key] = resolved;
      }
    } else {
      resolveRefs(value, root);
    }
  }
}

function resolveRef(ref: string, root: unknown): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  let current: unknown = root;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

type V3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;

function isV3Document(spec: OpenAPISpec): spec is V3Document {
  return "openapi" in spec;
}

export function buildNavItems(spec: OpenAPISpec): NavItem[] {
  const items: NavItem[] = [];

  items.push({
    id: "info",
    label: spec.info?.title ?? "API Info",
    type: "info",
  });

  if (isV3Document(spec) && spec.paths) {
    const endpointChildren: NavItem[] = [];
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (!pathItem) continue;
      const methods = [
        "get",
        "post",
        "put",
        "delete",
        "patch",
        "options",
        "head",
      ] as const;
      for (const method of methods) {
        const operation = (pathItem as Record<string, unknown>)[method] as
          | OpenAPIV3.OperationObject
          | undefined;
        if (operation) {
          const summary = operation.summary ?? `${method.toUpperCase()} ${path}`;
          endpointChildren.push({
            id: `endpoint-${method}-${path}`,
            label: summary,
            type: "endpoint",
            method,
            path,
          });
        }
      }
    }
    if (endpointChildren.length > 0) {
      items.push({
        id: "endpoints",
        label: `Endpoints (${endpointChildren.length})`,
        type: "section",
        children: endpointChildren,
      });
    }
  }

  if (isV3Document(spec)) {
    const components = spec.components;
    if (components?.schemas) {
      const schemaChildren: NavItem[] = [
        {
          id: "schema-hierarchy",
          label: "⊞ Hierarchy View",
          type: "schema-hierarchy" as const,
        },
        ...Object.keys(components.schemas).map(
          (name) => ({
            id: `schema-${name}`,
            label: name,
            type: "schema" as const,
          })
        ),
      ];
      if (schemaChildren.length > 0) {
        items.push({
          id: "schemas",
          label: `Schemas (${schemaChildren.length})`,
          type: "section",
          children: schemaChildren,
        });
      }
    }
  }

  return items;
}

type SchemaObjectLike = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export function buildSchemaRelationships(spec: OpenAPISpec): SchemaNode[] {
  if (!isV3Document(spec)) return [];

  const schemas = spec.components?.schemas;
  if (!schemas) return [];

  const schemaEntries = Object.entries(schemas) as [string, SchemaObjectLike][];
  const schemaByRef = new Map<object, string>();
  for (const [name, schema] of schemaEntries) {
    if (schema && typeof schema === "object") {
      schemaByRef.set(schema, name);
    }
  }

  function findSchemaName(obj: unknown): string | undefined {
    if (obj && typeof obj === "object") {
      return schemaByRef.get(obj);
    }
    return undefined;
  }

  function collectRelationships(schema: SchemaObjectLike): SchemaRelationship[] {
    const rels: SchemaRelationship[] = [];

    if (schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        const ps = propSchema as SchemaObjectLike;
        const ref = findSchemaName(ps);
        if (ref) {
          rels.push({ property: prop, targetSchema: ref, relationType: "property" });
        } else if (ps.type === "array" && "items" in ps && ps.items) {
          const itemRef = findSchemaName(ps.items);
          if (itemRef) {
            rels.push({ property: prop, targetSchema: itemRef, relationType: "array-item" });
          }
        }
      }
    }

    const compositionKeys = ["allOf", "oneOf", "anyOf"] as const;
    for (const key of compositionKeys) {
      const list = schema[key] as SchemaObjectLike[] | undefined;
      if (list) {
        for (const entry of list) {
          const ref = findSchemaName(entry);
          if (ref) {
            rels.push({ property: key, targetSchema: ref, relationType: key });
          }
        }
      }
    }

    return rels;
  }

  return schemaEntries.map(([name, schema]) => ({
    name,
    relationships: collectRelationships(schema),
  }));
}
