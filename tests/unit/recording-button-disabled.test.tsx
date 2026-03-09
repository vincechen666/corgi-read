import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { RecordingButton } from "@/components/reader/recording-button";

test("disables recording interaction when no document is open", () => {
  render(<RecordingButton disabled onStop={async () => {}} />);

  expect(
    screen.getByRole("button", { name: /start retelling/i }),
  ).toBeDisabled();
});
