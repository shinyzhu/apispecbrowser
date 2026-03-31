import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("App", () => {
  it("renders the welcome screen initially", () => {
    render(<App />);
    expect(screen.getByText("API Spec Browser")).toBeInTheDocument();
    expect(
      screen.getByText("Browse OpenAPI Specifications")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("OpenAPI spec URL")).toBeInTheDocument();
    expect(screen.getByText("Open Local File")).toBeInTheDocument();
  });

  it("shows Load URL button disabled when URL is empty", () => {
    render(<App />);
    const loadBtn = screen.getByText("Load URL");
    expect(loadBtn).toBeDisabled();
  });

  it("enables Load URL button when URL is entered", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("OpenAPI spec URL");
    await user.type(input, "https://example.com/spec.json");
    const loadBtn = screen.getByText("Load URL");
    expect(loadBtn).not.toBeDisabled();
  });
});
