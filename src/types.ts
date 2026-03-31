import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPISpec = OpenAPI.Document;
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export interface NavItem {
  id: string;
  label: string;
  type: "info" | "endpoint" | "schema" | "section";
  method?: string;
  path?: string;
  children?: NavItem[];
}

export type ViewTarget =
  | { kind: "info" }
  | { kind: "endpoint"; method: string; path: string }
  | { kind: "schema"; name: string };
