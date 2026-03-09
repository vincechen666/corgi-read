import { Card } from "@/components/ui/card";
import { PillTabs } from "@/components/ui/pill-tabs";

export function LearningSidebar() {
  return (
    <Card className="w-[372px] p-7">
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        LEARNING SIDEBAR
      </p>
      <h2 className="mt-4 font-serif text-4xl font-medium text-[#1a1a1a]">
        你的学习沉淀
      </h2>
      <p className="mt-3 max-w-[316px] text-sm leading-6 text-[#6a625a]">
        录音记录、收藏内容和表达库都沉淀在右侧，阅读区保持专注。
      </p>

      <div className="mt-7">
        <PillTabs items={["录音", "收藏", "表达库"]} activeItem="录音" />
      </div>

      <div className="mt-7 space-y-7">
        <section>
          <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
            最新复述
          </p>
          <Card className="mt-3 bg-[#fcfbf8] p-5">
            <p className="font-mono text-xs text-[#8a8178]">08:42 PM • Page 12</p>
            <h3 className="mt-3 max-w-[280px] font-serif text-[20px] font-medium leading-[1.35] text-[#1a1a1a]">
              The author shows that people felt close to Multivac, but never
              fully understood it.
            </h3>
            <p className="mt-3 max-w-[280px] text-sm leading-6 text-[#6a625a]">
              AI 点评：理解准确，表达自然度中等，句子连接词可以更像母语者。
            </p>
            <button
              type="button"
              className="mt-4 rounded-full bg-[#eaf4f1] px-4 py-2 text-sm font-semibold text-[#0d6e6e]"
            >
              查看分析详情
            </button>
          </Card>
        </section>

        <section>
          <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
            最近收藏
          </p>
          <Card className="mt-3 border-transparent bg-[#fff7f0] p-4">
            <h3 className="max-w-[284px] font-serif text-[20px] font-medium leading-[1.35] text-[#1a1a1a]">
              faithful attendants of Multivac
            </h3>
            <p className="mt-2 text-[15px] font-semibold text-[#c25b34]">
              Multivac 的忠实看护者
            </p>
            <p className="mt-2 font-mono text-[11px] text-[#8a8178]">
              来自 Page 12 • 句子收藏
            </p>
          </Card>
        </section>

        <section>
          <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
            表达库
          </p>
          <Card className="mt-3 border-transparent bg-[#f6fbfb] p-4">
            <h3 className="max-w-[284px] font-serif text-[19px] font-medium leading-[1.35] text-[#1a1a1a]">
              They felt close to Multivac, yet its mysteries stayed beyond
              them.
            </h3>
            <p className="mt-3 max-w-[284px] text-sm leading-6 text-[#4b5b5b]">
              更地道的对比句式，可替换 “they know it well but...” 这样的平直表达。
            </p>
            <p className="mt-3 font-mono text-[11px] text-[#8a8178]">
              来源：08:42 PM 录音
            </p>
          </Card>
        </section>
      </div>
    </Card>
  );
}
