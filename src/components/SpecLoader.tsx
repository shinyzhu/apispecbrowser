import { useState, useRef } from "react";

interface SpecLoaderProps {
  onLoadFromUrl: (url: string) => void;
  onLoadFromFile: (content: string) => void;
  loading: boolean;
  error: string | null;
}

export default function SpecLoader({
  onLoadFromUrl,
  onLoadFromFile,
  loading,
  error,
}: SpecLoaderProps) {
  const [url, setUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      onLoadFromUrl(url.trim());
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLoadFromFile(reader.result);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="spec-loader">
      <form onSubmit={handleUrlSubmit} className="url-form">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter OpenAPI spec URL (JSON or YAML)..."
          className="url-input"
          disabled={loading}
          aria-label="OpenAPI spec URL"
        />
        <button type="submit" disabled={loading || !url.trim()} className="load-btn">
          {loading ? "Loading..." : "Load URL"}
        </button>
      </form>
      <div className="file-upload">
        <span className="divider-text">or</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="file-btn"
        >
          Open Local File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileChange}
          hidden
          aria-label="Upload OpenAPI spec file"
        />
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
    </div>
  );
}
