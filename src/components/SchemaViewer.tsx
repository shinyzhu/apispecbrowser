import type { OpenAPISpec, SchemaObject } from "../types";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

type V3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;

interface SchemaViewerProps {
  spec: OpenAPISpec;
  schemaName: string;
}

function PropertyRow({
  name,
  schema,
  required,
  depth = 0,
}: {
  name: string;
  schema: SchemaObject;
  required: boolean;
  depth?: number;
}) {
  const typeStr = getTypeString(schema);
  const hasChildren =
    schema.type === "object" ||
    schema.properties ||
    (schema.type === "array" &&
      "items" in schema &&
      ((schema.items as SchemaObject)?.type === "object" ||
        (schema.items as SchemaObject)?.properties));

  const childProperties =
    schema.type === "array" && "items" in schema
      ? (schema.items as SchemaObject)?.properties
      : schema.properties;

  const childRequired =
    schema.type === "array" && "items" in schema
      ? (schema.items as SchemaObject)?.required
      : schema.required;

  return (
    <>
      <tr className={`depth-${Math.min(depth, 4)}`}>
        <td style={{ paddingLeft: depth * 20 + 8 }}>
          <code className={required ? "prop-required" : ""}>{name}</code>
          {required && <span className="required-mark">*</span>}
        </td>
        <td>
          <span className="type-label">{typeStr}</span>
        </td>
        <td>{schema.description ?? ""}</td>
        <td className="constraints">
          {schema.enum && <span>Enum: [{schema.enum.join(", ")}]</span>}
          {"minimum" in schema && schema.minimum !== undefined && (
            <span>Min: {schema.minimum}</span>
          )}
          {"maximum" in schema && schema.maximum !== undefined && (
            <span>Max: {schema.maximum}</span>
          )}
          {"minLength" in schema && schema.minLength !== undefined && (
            <span>MinLen: {schema.minLength}</span>
          )}
          {"maxLength" in schema && schema.maxLength !== undefined && (
            <span>MaxLen: {schema.maxLength}</span>
          )}
          {"pattern" in schema && schema.pattern && (
            <span>Pattern: <code>{schema.pattern}</code></span>
          )}
          {"default" in schema && schema.default !== undefined && (
            <span>Default: {JSON.stringify(schema.default)}</span>
          )}
        </td>
      </tr>
      {hasChildren &&
        childProperties &&
        depth < 5 &&
        Object.entries(childProperties).map(([childName, childSchema]) => (
          <PropertyRow
            key={`${name}.${childName}`}
            name={childName}
            schema={childSchema as SchemaObject}
            required={childRequired?.includes(childName) ?? false}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

function getTypeString(schema: SchemaObject): string {
  if (schema.type === "array" && "items" in schema && schema.items) {
    const items = schema.items as SchemaObject;
    return `array<${getTypeString(items)}>`;
  }
  if (schema.oneOf) return `oneOf[${schema.oneOf.length}]`;
  if (schema.anyOf) return `anyOf[${schema.anyOf.length}]`;
  if (schema.allOf) return `allOf[${schema.allOf.length}]`;

  const type = schema.type ?? "any";
  const format = schema.format ? ` (${schema.format})` : "";
  return `${String(type)}${format}`;
}

export default function SchemaViewer({ spec, schemaName }: SchemaViewerProps) {
  if (!("openapi" in spec)) {
    return <p>Only OpenAPI 3.x specs are supported for schema viewing.</p>;
  }

  const v3Spec = spec as V3Document;
  const schema = v3Spec.components?.schemas?.[schemaName] as
    | SchemaObject
    | undefined;

  if (!schema) {
    return <p>Schema not found: {schemaName}</p>;
  }

  const requiredSet = new Set(schema.required ?? []);

  return (
    <div className="schema-viewer">
      <h2>{schemaName}</h2>
      <span className="type-label main-type">{getTypeString(schema)}</span>
      {schema.description && (
        <p className="schema-description">{schema.description}</p>
      )}

      {schema.properties && (
        <table className="properties-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
              <th>Constraints</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(schema.properties).map(([name, prop]) => (
              <PropertyRow
                key={name}
                name={name}
                schema={prop as SchemaObject}
                required={requiredSet.has(name)}
              />
            ))}
          </tbody>
        </table>
      )}

      {schema.enum && (
        <div className="enum-values">
          <h3>Enum Values</h3>
          <ul>
            {schema.enum.map((val, i) => (
              <li key={i}>
                <code>{JSON.stringify(val)}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
