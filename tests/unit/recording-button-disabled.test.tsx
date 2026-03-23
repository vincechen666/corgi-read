import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { RecordingButton } from "@/components/reader/recording-button";

test("disables recording interaction when no document is open", () => {
  render(<RecordingButton disabled onStop={async () => {}} />);

  const button = screen.getByRole("button", { name: /start retelling/i });

  expect(button).toBeDisabled();
  expect(button).toHaveClass("disabled:cursor-not-allowed");
  expect(button).not.toHaveClass("disabled:cursor-wait");
  expect(screen.getByTestId("recording-button-icon")).toBeInTheDocument();
});
