# Scaffolded Learning Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the current PDF reader into a scaffolded learning loop for lower-intermediate learners by adding sentence-level comprehension support, leveled speaking tasks, actionable retry feedback, and a review-first sidebar flow.

**Architecture:** Keep the existing single-page reader shell, but add a dedicated learning-flow layer between the PDF stage and the sidebar. The implementation should introduce a sentence-study data model, a current-task panel near the reader, output-mode state that drives recording behavior, and a review queue that reuses the existing sidebar persistence paths instead of creating a separate learning subsystem.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Zustand, Vitest, Testing Library, Playwright

---

### Task 1: Add the scaffolded learning-loop state model

**Files:**
- Create: `src/features/learning/learning-loop-schema.ts`
- Create: `src/features/learning/learning-loop-store.ts`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/learning-loop-store.test.ts`

**Step 1: Write the failing test**

```ts
import { createLearningLoopStore } from "@/features/learning/learning-loop-store";

it("tracks the current sentence study item and selected output mode", () => {
  const store = createLearningLoopStore();

  store.getState().startSentenceStudy({
    id: "sentence-1",
    sourceText: "The machine answered the question.",
    translation: "这台机器回答了这个问题。",
    summary: "这句话在说机器给出了答案。",
    structureNote: "主语 The machine，谓语 answered，宾语 the question。",
    keyExpression: "answered the question",
  });

  store.getState().setOutputMode("guided");

  expect(store.getState().currentStudyItem?.id).toBe("sentence-1");
  expect(store.getState().outputMode).toBe("guided");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/learning-loop-store.test.ts`
Expected: FAIL because the learning-loop store does not exist yet.

**Step 3: Write minimal implementation**

```ts
export type OutputMode = "repeat" | "guided" | "retell";

export function createLearningLoopStore() {
  return createStore(() => ({
    currentStudyItem: null,
    outputMode: "repeat" as OutputMode,
    startSentenceStudy: (item) => set({ currentStudyItem: item }),
    setOutputMode: (outputMode) => set({ outputMode }),
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/learning-loop-store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/learning/learning-loop-schema.ts src/features/learning/learning-loop-store.ts tests/unit/learning-loop-store.test.ts src/components/reader/app-shell.tsx
git commit -m "feat: add scaffolded learning loop state"
```

### Task 2: Add a sentence learning card to the PDF stage

**Files:**
- Create: `src/components/reader/sentence-learning-card.tsx`
- Modify: `src/components/reader/pdf-stage.tsx`
- Modify: `src/features/translation/translation-schema.ts`
- Test: `tests/unit/sentence-learning-card.test.tsx`
- Test: `tests/unit/pdf-stage-translation-popover.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { SentenceLearningCard } from "@/components/reader/sentence-learning-card";

it("shows translation, summary, structure note, and key expression", () => {
  render(
    <SentenceLearningCard
      item={{
        sourceText: "The machine answered the question.",
        translation: "这台机器回答了这个问题。",
        summary: "这句话在说机器给出了答案。",
        structureNote: "主语 The machine，谓语 answered，宾语 the question。",
        keyExpression: "answered the question",
      }}
    />,
  );

  expect(screen.getByText("这句话在说机器给出了答案。")).toBeInTheDocument();
  expect(screen.getByText("answered the question")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sentence-learning-card.test.tsx`
Expected: FAIL because the card component does not exist yet.

**Step 3: Write minimal implementation**

```tsx
export function SentenceLearningCard({ item }: { item: SentenceStudyItem }) {
  return (
    <section>
      <p>{item.translation}</p>
      <p>{item.summary}</p>
      <p>{item.structureNote}</p>
      <p>{item.keyExpression}</p>
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/sentence-learning-card.test.tsx tests/unit/pdf-stage-translation-popover.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/sentence-learning-card.tsx src/components/reader/pdf-stage.tsx src/features/translation/translation-schema.ts tests/unit/sentence-learning-card.test.tsx tests/unit/pdf-stage-translation-popover.test.tsx
git commit -m "feat: add sentence learning card"
```

### Task 3: Add leveled speaking modes beside the reader

**Files:**
- Create: `src/components/reader/output-mode-panel.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/recording-button.tsx`
- Modify: `src/features/recording/recorder-schema.ts`
- Test: `tests/unit/output-mode-panel.test.tsx`
- Test: `tests/unit/recording-button-disabled.test.tsx`
- Test: `tests/unit/app-shell-smoke.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutputModePanel } from "@/components/reader/output-mode-panel";

it("lets the learner switch between repeat, guided, and retell modes", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  render(<OutputModePanel value="repeat" onChange={onChange} />);

  await user.click(screen.getByRole("button", { name: "看提示说" }));

  expect(onChange).toHaveBeenCalledWith("guided");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/output-mode-panel.test.tsx`
Expected: FAIL because the output-mode panel does not exist yet.

**Step 3: Write minimal implementation**

```tsx
const modes = [
  { value: "repeat", label: "跟着说" },
  { value: "guided", label: "看提示说" },
  { value: "retell", label: "自己复述" },
];
```

Render the three buttons, wire them to the learning-loop store, and update the recording CTA copy so the current mode is visible before recording starts.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/output-mode-panel.test.tsx tests/unit/recording-button-disabled.test.tsx tests/unit/app-shell-smoke.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/output-mode-panel.tsx src/components/reader/app-shell.tsx src/components/reader/recording-button.tsx src/features/recording/recorder-schema.ts tests/unit/output-mode-panel.test.tsx tests/unit/recording-button-disabled.test.tsx tests/unit/app-shell-smoke.test.tsx
git commit -m "feat: add leveled speaking modes"
```

### Task 4: Make analysis feedback actionable with an immediate retry path

**Files:**
- Modify: `src/components/reader/analysis-modal.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/features/analysis/analysis-schema.ts`
- Test: `tests/unit/analysis-modal.test.tsx`
- Test: `tests/unit/app-shell-analysis-error.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { AnalysisModal } from "@/components/reader/analysis-modal";

it("shows a retry speaking action with the recommended replacement", () => {
  render(
    <AnalysisModal
      open
      onClose={() => {}}
      onAddExpression={() => {}}
      onRetrySpeaking={() => {}}
      result={{
        transcript: "People know it well.",
        corrected: "People felt close to it.",
        grammar: "Use felt close to for a more natural relationship phrase.",
        nativeExpression: "felt close to it",
        coachFeedback: "Try the more natural version once right away.",
      }}
    />,
  );

  expect(screen.getByRole("button", { name: "现在再说一遍" })).toBeInTheDocument();
  expect(screen.getByText("People felt close to it.")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/analysis-modal.test.tsx`
Expected: FAIL because the retry action is not rendered yet.

**Step 3: Write minimal implementation**

```tsx
<button onClick={onRetrySpeaking} type="button">
  现在再说一遍
</button>
```

Wire the button to close the modal, preserve the selected output mode, and return the learner to a ready-to-record state without losing the latest study item.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/analysis-modal.test.tsx tests/unit/app-shell-analysis-error.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/analysis-modal.tsx src/components/reader/app-shell.tsx src/features/analysis/analysis-schema.ts tests/unit/analysis-modal.test.tsx tests/unit/app-shell-analysis-error.test.tsx
git commit -m "feat: add actionable retry feedback"
```

### Task 5: Convert the sidebar from archive tabs into a review queue

**Files:**
- Modify: `src/components/reader/learning-sidebar.tsx`
- Modify: `src/features/sidebar/sidebar-store.ts`
- Modify: `src/features/sidebar/sidebar-storage.ts`
- Test: `tests/unit/learning-sidebar-tabs.test.tsx`
- Test: `tests/unit/sidebar-store.test.ts`
- Test: `tests/unit/learning-sidebar-cloud-state.test.tsx`

**Step 1: Write the failing test**

```ts
import { sidebarStore } from "@/features/sidebar/sidebar-store";

it("adds new study assets into review buckets", () => {
  sidebarStore.getState().addReviewItem({
    id: "review-1",
    bucket: "new-today",
    title: "answered the question",
    note: "用来描述回答了关键问题",
    sourceType: "expression",
  });

  expect(sidebarStore.getState().reviewQueue["new-today"]).toHaveLength(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sidebar-store.test.ts`
Expected: FAIL because the review queue model does not exist.

**Step 3: Write minimal implementation**

```ts
reviewQueue: {
  "new-today": [],
  "needs-retry": [],
  "worth-reviewing": [],
},
addReviewItem: (item) => set((state) => ({
  reviewQueue: {
    ...state.reviewQueue,
    [item.bucket]: [item, ...state.reviewQueue[item.bucket]],
  },
})),
```

Update the sidebar UI so the top-level tabs become review-oriented while still preserving access to recordings and saved items where necessary.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/sidebar-store.test.ts tests/unit/learning-sidebar-tabs.test.tsx tests/unit/learning-sidebar-cloud-state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/learning-sidebar.tsx src/features/sidebar/sidebar-store.ts src/features/sidebar/sidebar-storage.ts tests/unit/learning-sidebar-tabs.test.tsx tests/unit/sidebar-store.test.ts tests/unit/learning-sidebar-cloud-state.test.tsx
git commit -m "feat: add review-first sidebar queue"
```

### Task 6: Add a first-session three-minute guided mission

**Files:**
- Create: `src/components/reader/first-session-mission.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/features/auth/auth-store.ts`
- Test: `tests/unit/first-session-mission.test.tsx`
- Test: `tests/unit/app-shell-smoke.test.tsx`
- Test: `tests/e2e/reader.spec.ts`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { FirstSessionMission } from "@/components/reader/first-session-mission";

it("shows the four-step first-session mission", () => {
  render(<FirstSessionMission open onDismiss={() => {}} />);

  expect(screen.getByText("读懂一句")).toBeInTheDocument();
  expect(screen.getByText("说一句")).toBeInTheDocument();
  expect(screen.getByText("收到一次反馈")).toBeInTheDocument();
  expect(screen.getByText("保存一个表达")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/first-session-mission.test.tsx`
Expected: FAIL because the mission component does not exist yet.

**Step 3: Write minimal implementation**

```tsx
export function FirstSessionMission({ open }: { open: boolean }) {
  if (!open) return null;
  return <aside>...</aside>;
}
```

Persist dismissal in existing client state so the mission appears on the first meaningful session only, and extend the reader E2E test to cover the new guided-entry path.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/first-session-mission.test.tsx tests/unit/app-shell-smoke.test.tsx`
Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/first-session-mission.tsx src/components/reader/app-shell.tsx src/features/auth/auth-store.ts tests/unit/first-session-mission.test.tsx tests/unit/app-shell-smoke.test.tsx tests/e2e/reader.spec.ts
git commit -m "feat: add first-session guided mission"
```

### Task 7: Polish copy, analytics hooks, and regression coverage

**Files:**
- Modify: `src/components/reader/top-bar.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/learning-sidebar.tsx`
- Test: `tests/unit/reader-shell.test.tsx`
- Test: `tests/unit/viewport-layout.test.tsx`
- Test: `tests/unit/app-shell-smoke.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

it("shows the learning-loop framing instead of archive-only copy", () => {
  render(<Home />);

  expect(screen.getByText("完成一个学习回合")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/reader-shell.test.tsx`
Expected: FAIL because the new framing copy and regression hooks are missing.

**Step 3: Write minimal implementation**

```tsx
<p>完成一个学习回合</p>
```

Add any non-invasive `data-testid` hooks needed for regression coverage, update visible copy to match the new learning-loop model, and keep the desktop-first layout stable.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/reader-shell.test.tsx tests/unit/viewport-layout.test.tsx tests/unit/app-shell-smoke.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/top-bar.tsx src/components/reader/app-shell.tsx src/components/reader/learning-sidebar.tsx tests/unit/reader-shell.test.tsx tests/unit/viewport-layout.test.tsx tests/unit/app-shell-smoke.test.tsx
git commit -m "chore: align reader copy with learning loop"
```

## Verification Checklist

- Run: `npm test -- tests/unit/learning-loop-store.test.ts tests/unit/sentence-learning-card.test.tsx tests/unit/output-mode-panel.test.tsx tests/unit/analysis-modal.test.tsx tests/unit/sidebar-store.test.ts tests/unit/first-session-mission.test.tsx`
- Run: `npm test -- tests/unit/app-shell-smoke.test.tsx tests/unit/reader-shell.test.tsx tests/unit/learning-sidebar-tabs.test.tsx tests/unit/pdf-stage-translation-popover.test.tsx`
- Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`
- Manually verify:
  - sentence selection opens the richer learning card
  - the learner can switch speaking modes before recording
  - AI feedback offers an immediate retry action
  - new study assets appear in review buckets
  - the first-session mission is visible only on first entry

## Rollout Notes

- Keep the old sidebar records accessible during the transition so existing users do not lose their stored recordings or favorites.
- Reuse the current cloud persistence paths first; do not introduce a second cloud sync model during this phase.
- If the richer sentence study card requires new translation fields from the backend, ship those fields behind a mock-safe fallback so local development stays usable.

Plan complete and saved to `docs/plans/2026-04-18-scaffolded-learning-loop-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
