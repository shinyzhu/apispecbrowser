import type { OpenAPISpec, NavItem } from "../types";
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
      const schemaChildren: NavItem[] = Object.keys(components.schemas).map(
        (name) => ({
          id: `schema-${name}`,
          label: name,
          type: "schema" as const,
        })
      );
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
