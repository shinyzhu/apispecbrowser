import { describe, it, expect } from "vitest";
import { buildNavItems, buildSchemaRelationships } from "../utils/parseSpec";
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
    expect(schemas!.children).toHaveLength(3);

    const hierarchyItem = schemas!.children![0];
    expect(hierarchyItem.type).toBe("schema-hierarchy");
    expect(hierarchyItem.id).toBe("schema-hierarchy");

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

describe("buildSchemaRelationships", () => {
  it("returns schema nodes for all schemas", () => {
    const nodes = buildSchemaRelationships(petstore as unknown as OpenAPISpec);
    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.name)).toEqual(["Pet", "Error"]);
  });

  it("returns empty array for spec without schemas", () => {
    const emptySpec: OpenAPISpec = {
      openapi: "3.0.3",
      info: { title: "Empty API", version: "1.0.0" },
      paths: {},
    } as OpenAPISpec;

    const nodes = buildSchemaRelationships(emptySpec);
    expect(nodes).toHaveLength(0);
  });

  it("detects property references between schemas", () => {
    const spec = {
      openapi: "3.0.3",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Address: {
            type: "object",
            properties: { street: { type: "string" } },
          },
          Person: {
            type: "object",
            properties: {
              name: { type: "string" },
              address: null as unknown, // will be set to reference
            },
          },
        },
      },
    };
    // Simulate resolved $ref by making the property reference the same object
    spec.components.schemas.Person.properties.address =
      spec.components.schemas.Address;

    const nodes = buildSchemaRelationships(spec as unknown as OpenAPISpec);
    const person = nodes.find((n) => n.name === "Person");
    expect(person).toBeDefined();
    expect(person!.relationships).toHaveLength(1);
    expect(person!.relationships[0]).toEqual({
      property: "address",
      targetSchema: "Address",
      relationType: "property",
    });
  });

  it("detects array item references", () => {
    const spec = {
      openapi: "3.0.3",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Tag: {
            type: "object",
            properties: { name: { type: "string" } },
          },
          Pet: {
            type: "object",
            properties: {
              tags: { type: "array", items: null as unknown },
            },
          },
        },
      },
    };
    spec.components.schemas.Pet.properties.tags.items =
      spec.components.schemas.Tag;

    const nodes = buildSchemaRelationships(spec as unknown as OpenAPISpec);
    const pet = nodes.find((n) => n.name === "Pet");
    expect(pet).toBeDefined();
    expect(pet!.relationships).toHaveLength(1);
    expect(pet!.relationships[0]).toEqual({
      property: "tags",
      targetSchema: "Tag",
      relationType: "array-item",
    });
  });

  it("detects allOf composition", () => {
    const baseSchema = {
      type: "object",
      properties: { id: { type: "integer" } },
    };
    const spec = {
      openapi: "3.0.3",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          Base: baseSchema,
          Extended: {
            allOf: [
              baseSchema,
              { type: "object", properties: { extra: { type: "string" } } },
            ],
          },
        },
      },
    };

    const nodes = buildSchemaRelationships(spec as unknown as OpenAPISpec);
    const extended = nodes.find((n) => n.name === "Extended");
    expect(extended).toBeDefined();
    expect(extended!.relationships).toHaveLength(1);
    expect(extended!.relationships[0]).toEqual({
      property: "allOf",
      targetSchema: "Base",
      relationType: "allOf",
    });
  });
});
