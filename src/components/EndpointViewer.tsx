import { useState } from "react";
import type { OpenAPISpec, SchemaObject } from "../types";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

type V3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;

interface EndpointViewerProps {
  spec: OpenAPISpec;
  method: string;
  path: string;
}

interface ExampleEntry {
  name: string;
  value: unknown;
  summary?: string;
}

function getExamples(mediaTypeObj: OpenAPIV3.MediaTypeObject): ExampleEntry[] {
  if (mediaTypeObj.examples) {
    return Object.entries(mediaTypeObj.examples)
      .filter(([, ex]) => ex && typeof ex === "object" && "value" in ex)
      .map(([name, ex]) => {
        const exObj = ex as OpenAPIV3.ExampleObject;
        return { name, value: exObj.value, summary: exObj.summary };
      });
  }
  if (mediaTypeObj.example !== undefined) {
    return [{ name: "Example", value: mediaTypeObj.example }];
  }
  return [];
}

function ExampleBlock({ examples }: { examples: ExampleEntry[] }) {
  const [selected, setSelected] = useState(0);
  if (examples.length === 0) return null;

  const current = examples[selected];
  return (
    <div className="example-block">
      <div className="example-header">
        <span className="example-label">Example</span>
        {examples.length > 1 && (
          <select
            className="example-select"
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {examples.map((ex, i) => (
              <option key={ex.name} value={i}>
                {ex.summary ?? ex.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <pre className="example-code">{JSON.stringify(current.value, null, 2)}</pre>
    </div>
  );
}

function SchemaPreview({ schema, depth = 0 }: { schema: SchemaObject; depth?: number }) {
  if (depth > 5) return <span className="schema-ellipsis">...</span>;

  if (schema.type === "array" && "items" in schema && schema.items) {
    return (
      <span className="schema-inline">
        Array&lt;<SchemaPreview schema={schema.items as SchemaObject} depth={depth + 1} />&gt;
      </span>
    );
  }

  if (schema.type === "object" || schema.properties) {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    return (
      <div className="schema-object" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        {"{"}
        {Object.entries(properties).map(([name, prop]) => (
          <div key={name} className="schema-property">
            <span className={`prop-name ${required.has(name) ? "required" : ""}`}>
              {name}
            </span>
            {required.has(name) && <span className="required-mark">*</span>}
            {": "}
            <SchemaPreview schema={prop as SchemaObject} depth={depth + 1} />
          </div>
        ))}
        {"}"}
      </div>
    );
  }

  const typeStr = schema.type ?? (schema.enum ? "enum" : "any");
  const format = schema.format ? ` (${schema.format})` : "";
  return (
    <span className="schema-type">
      {String(typeStr)}{format}
      {schema.enum && ` [${schema.enum.join(", ")}]`}
    </span>
  );
}

function ResponseSection({ responses }: { responses: Record<string, OpenAPIV3.ResponseObject> }) {
  return (
    <div className="responses-section">
      <h3>Responses</h3>
      {Object.entries(responses).map(([code, response]) => (
        <div key={code} className="response-item">
          <div className="response-header">
            <span className={`status-code status-${code.charAt(0)}xx`}>{code}</span>
            <span className="response-desc">{response.description}</span>
          </div>
          {response.content && Object.entries(response.content).map(([mediaType, content]) => {
            const examples = getExamples(content as OpenAPIV3.MediaTypeObject);
            return (
              <div key={mediaType} className="response-content">
                <span className="media-type">{mediaType}</span>
                <div className={`schema-example-row${examples.length > 0 ? " has-example" : ""}`}>
                  {content.schema && (
                    <div className="response-schema">
                      <SchemaPreview schema={content.schema as SchemaObject} />
                    </div>
                  )}
                  <ExampleBlock examples={examples} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function EndpointViewer({ spec, method, path }: EndpointViewerProps) {
  if (!("openapi" in spec)) {
    return <p>Only OpenAPI 3.x specs are supported for endpoint viewing.</p>;
  }

  const v3Spec = spec as V3Document;
  const pathItem = v3Spec.paths?.[path];
  if (!pathItem) return <p>Path not found: {path}</p>;

  const operation = (pathItem as Record<string, unknown>)[method] as OpenAPIV3.OperationObject | undefined;
  if (!operation) return <p>Operation not found: {method.toUpperCase()} {path}</p>;

  const parameters = (operation.parameters ?? []) as OpenAPIV3.ParameterObject[];

  const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject | undefined;

  return (
    <div className="endpoint-viewer">
      <div className="endpoint-header">
        <span className={`method-badge method-${method.toLowerCase()} large`}>
          {method.toUpperCase()}
        </span>
        <code className="endpoint-path">{path}</code>
      </div>

      {operation.summary && <p className="endpoint-summary">{operation.summary}</p>}
      {operation.description && <p className="endpoint-description">{operation.description}</p>}

      {operation.tags && operation.tags.length > 0 && (
        <div className="tags">
          {operation.tags.map((tag) => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
        </div>
      )}

      {parameters.length > 0 && (
        <div className="parameters-section">
          <h3>Parameters</h3>
          <table className="params-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>In</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param) => (
                <tr key={`${param.in}-${param.name}`}>
                  <td><code>{param.name}</code></td>
                  <td><span className="param-in">{param.in}</span></td>
                  <td>
                    {param.schema && (
                      <SchemaPreview schema={param.schema as SchemaObject} />
                    )}
                  </td>
                  <td>{param.required ? "✓" : ""}</td>
                  <td>{param.description ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {requestBody && (
        <div className="request-body-section">
          <h3>Request Body</h3>
          {requestBody.description && <p>{requestBody.description}</p>}
          {requestBody.required && <span className="required-label">Required</span>}
          {requestBody.content && Object.entries(requestBody.content).map(([mediaType, content]) => {
            const examples = getExamples(content as OpenAPIV3.MediaTypeObject);
            return (
              <div key={mediaType} className="request-content">
                <span className="media-type">{mediaType}</span>
                <div className={`schema-example-row${examples.length > 0 ? " has-example" : ""}`}>
                  {content.schema && (
                    <div className="request-schema">
                      <SchemaPreview schema={content.schema as SchemaObject} />
                    </div>
                  )}
                  <ExampleBlock examples={examples} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {operation.responses && (
        <ResponseSection responses={operation.responses as Record<string, OpenAPIV3.ResponseObject>} />
      )}
    </div>
  );
}
