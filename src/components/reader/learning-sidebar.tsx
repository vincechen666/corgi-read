"use client";

import { Card } from "@/components/ui/card";
import {
  useSidebarStore,
  type RecordingItem,
} from "@/features/sidebar/sidebar-store";

const tabs = ["录音", "收藏", "表达库"] as const;

type LearningSidebarProps = {
  onOpenRecording?: (recording: RecordingItem) => void;
};

export function LearningSidebar({ onOpenRecording }: LearningSidebarProps) {
  const activeTab = useSidebarStore((state) => state.activeTab);
  const setActiveTab = useSidebarStore((state) => state.setActiveTab);
  const recordings = useSidebarStore((state) => state.recordings);
  const favorites = useSidebarStore((state) => state.favorites);
  const expressions = useSidebarStore((state) => state.expressions);

  return (
    <Card
      className="flex h-full min-h-0 w-[372px] flex-col p-7"
      data-testid="learning-sidebar"
    >
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        LEARNING SIDEBAR
      </p>
      <h2 className="mt-4 font-serif text-4xl font-medium text-[#1a1a1a]">
        你的学习沉淀
      </h2>
      <p className="mt-3 max-w-[316px] text-sm leading-6 text-[#6a625a]">
        录音记录、收藏内容和表达库都沉淀在右侧，阅读区保持专注。
      </p>

      <div className="mt-7 inline-flex rounded-full bg-[#f4f0ea] p-1">
        {tabs.map((tab) => {
          const active = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              className={[
                "rounded-full px-6 py-2 text-sm transition",
                active
                  ? "bg-white font-semibold text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  : "font-medium text-[#8a8178]",
              ].join(" ")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div
        className="mt-7 min-h-0 flex-1 overflow-y-auto pr-2"
        data-testid="learning-sidebar-scroll"
      >
        <div className="space-y-7">
        {activeTab === "录音" ? (
          <section>
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
              最新复述
            </p>
            {recordings.map((recording) => (
              <Card key={recording.id} className="mt-3 bg-[#fcfbf8] p-5">
                <p className="font-mono text-xs text-[#8a8178]">
                  {recording.createdAt} • Page {recording.page}
                </p>
                <h3 className="mt-3 max-w-[280px] font-serif text-[20px] font-medium leading-[1.35] text-[#1a1a1a]">
                  {recording.summary}
                </h3>
                <p className="mt-3 max-w-[280px] text-sm leading-6 text-[#6a625a]">
                  {recording.feedback}
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-[#eaf4f1] px-4 py-2 text-sm font-semibold text-[#0d6e6e] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!recording.analysis}
                  onClick={() => {
                    if (recording.analysis && onOpenRecording) {
                      onOpenRecording(recording);
                    }
                  }}
                >
                  查看分析详情
                </button>
              </Card>
            ))}
          </section>
        ) : null}

        {activeTab === "收藏" ? (
          <section>
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
              最近收藏
            </p>
            {favorites.map((favorite) => (
              <Card
                key={favorite.id}
                className="mt-3 border-transparent bg-[#fff7f0] p-4"
              >
                <h3 className="max-w-[284px] font-serif text-[20px] font-medium leading-[1.35] text-[#1a1a1a]">
                  {favorite.sourceText}
                </h3>
                <p className="mt-2 text-[15px] font-semibold text-[#c25b34]">
                  {favorite.translatedText}
                </p>
                <p className="mt-2 font-mono text-[11px] text-[#8a8178]">
                  来自 Page {favorite.page} • {favorite.type} 收藏
                </p>
              </Card>
            ))}
          </section>
        ) : null}

        {activeTab === "表达库" ? (
          <section>
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
              表达库
            </p>
            {expressions.map((expression) => (
              <Card
                key={expression.id}
                className="mt-3 border-transparent bg-[#f6fbfb] p-4"
              >
                <h3 className="max-w-[284px] font-serif text-[19px] font-medium leading-[1.35] text-[#1a1a1a]">
                  {expression.phrase}
                </h3>
                <p className="mt-3 max-w-[284px] text-sm leading-6 text-[#4b5b5b]">
                  {expression.note}
                </p>
                <p className="mt-3 font-mono text-[11px] text-[#8a8178]">
                  来源：{expression.sourceRecordingId}
                </p>
              </Card>
            ))}
          </section>
        ) : null}
        </div>
      </div>
    </Card>
  );
}
