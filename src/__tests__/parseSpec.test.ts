import { describe, it, expect } from "vitest";
import { buildNavItems } from "../utils/parseSpec";
import type { OpenAPISpec } from "../types";
import petstore from "./fixtures/petstore.json";

describe("buildNavItems", () => {
  it("builds navigation items from a valid OpenAPI spec", () => {
    const items = buildNavItems(petstore as unknown as OpenAPISpec);

    expect(items.length).toBe(3);
    expect(items[0]).toEqual({
      id: "info",
      label: "Petstore API",
      type: "info",
    });
  });

  it("creates endpoints section with correct children", () => {
    const items = buildNavItems(petstore as unknown as OpenAPISpec);
    const endpoints = items.find((i) => i.id === "endpoints");

    expect(endpoints).toBeDefined();
    expect(endpoints!.type).toBe("section");
    expect(endpoints!.children).toHaveLength(4);

    const getListPets = endpoints!.children!.find(
      (c) => c.method === "get" && c.path === "/pets"
    );
    expect(getListPets).toBeDefined();
    expect(getListPets!.label).toBe("List all pets");
  });

  it("creates schemas section with correct children", () => {
    const items = buildNavItems(petstore as unknown as OpenAPISpec);
    const schemas = items.find((i) => i.id === "schemas");

    expect(schemas).toBeDefined();
    expect(schemas!.type).toBe("section");
    expect(schemas!.children).toHaveLength(2);

    const petSchema = schemas!.children!.find((c) => c.label === "Pet");
    expect(petSchema).toBeDefined();
    expect(petSchema!.type).toBe("schema");
  });

  it("handles empty spec gracefully", () => {
    const emptySpec: OpenAPISpec = {
      openapi: "3.0.3",
      info: { title: "Empty API", version: "1.0.0" },
      paths: {},
    } as OpenAPISpec;

    const items = buildNavItems(emptySpec);
    expect(items.length).toBe(1);
    expect(items[0].label).toBe("Empty API");
  });
});
