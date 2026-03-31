import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPISpec = OpenAPI.Document;
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export interface NavItem {
  id: string;
  label: string;
  type: "info" | "endpoint" | "schema" | "section" | "schema-hierarchy";
  method?: string;
  path?: string;
  children?: NavItem[];
}

export type ViewTarget =
  | { kind: "info" }
  | { kind: "endpoint"; method: string; path: string }
  | { kind: "schema"; name: string }
  | { kind: "schema-hierarchy" };

export interface SchemaRelationship {
  property: string;
  targetSchema: string;
  relationType: "property" | "array-item" | "allOf" | "oneOf" | "anyOf";
}

export interface SchemaNode {
  name: string;
  relationships: SchemaRelationship[];
}
