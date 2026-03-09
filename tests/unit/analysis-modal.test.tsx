import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";

import { AnalysisModal } from "@/components/reader/analysis-modal";

test("closes when the backdrop is clicked", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  render(
    <AnalysisModal
      open
      onClose={onClose}
      result={{
        transcript: "People knew Multivac well...",
        corrected: "People felt close to Multivac...",
        grammar: "More natural contrast needed.",
        nativeExpression: "its mysteries still seemed beyond them",
        coachFeedback: "Use yet for smoother contrast.",
      }}
    />,
  );

  await user.click(screen.getByTestId("analysis-backdrop"));

  expect(onClose).toHaveBeenCalled();
});
