import type { OpenAPISpec } from "../types";

interface InfoViewerProps {
  spec: OpenAPISpec;
}

export default function InfoViewer({ spec }: InfoViewerProps) {
  const info = spec.info;

  return (
    <div className="info-viewer">
      <h1>{info.title}</h1>
      {info.version && (
        <span className="version-badge">v{info.version}</span>
      )}
      {info.description && (
        <p className="api-description">{info.description}</p>
      )}

      <div className="info-details">
        {info.contact && (
          <div className="info-section">
            <h3>Contact</h3>
            <dl>
              {info.contact.name && (
                <>
                  <dt>Name</dt>
                  <dd>{info.contact.name}</dd>
                </>
              )}
              {info.contact.email && (
                <>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${info.contact.email}`}>
                      {info.contact.email}
                    </a>
                  </dd>
                </>
              )}
              {info.contact.url && (
                <>
                  <dt>URL</dt>
                  <dd>
                    <a href={info.contact.url} target="_blank" rel="noreferrer">
                      {info.contact.url}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        {info.license && (
          <div className="info-section">
            <h3>License</h3>
            <p>
              {info.license.url ? (
                <a href={info.license.url} target="_blank" rel="noreferrer">
                  {info.license.name}
                </a>
              ) : (
                info.license.name
              )}
            </p>
          </div>
        )}

        {"servers" in spec && Array.isArray(spec.servers) && spec.servers.length > 0 && (
          <div className="info-section">
            <h3>Servers</h3>
            <ul className="servers-list">
              {spec.servers.map(
                (
                  server: { url: string; description?: string },
                  i: number
                ) => (
                  <li key={i}>
                    <code>{server.url}</code>
                    {server.description && (
                      <span className="server-desc">
                        {" "}
                        — {server.description}
                      </span>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
