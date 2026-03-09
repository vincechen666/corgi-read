import { Card } from "@/components/ui/card";

const paragraphs = [
  "The last question was asked for the first time, half in jest, on May 21, 2061, at a time when humanity first stepped into the light of practical immortality.",
  "The question came about as a result of a five-dollar bet over highballs, and it happened this way: Alexander Adell and Bertram Lupov were two of the faithful attendants of Multivac.",
  "They had grown used to the mighty machine and understood it with the intimacy of men who keep watch beside a sleeping giant, yet they still joked about the impossible mysteries it held.",
  "The selected sentence is highlighted here to suggest a deliberate translation moment rather than always-on bilingual display.",
  "Below the page, the learner can stop reading, summarize the paragraph aloud, then compare their own language against an AI-enhanced explanation panel.",
];

export function PdfStage() {
  return (
    <Card className="relative min-h-[760px] flex-1 p-9">
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        READING WORKSPACE
      </p>
      <h2 className="mt-4 font-serif text-4xl font-medium text-[#1a1a1a]">
        Read in English. Ask for Chinese only when needed.
      </h2>

      <Card className="mt-10 min-h-[670px] w-full bg-[#fffdf9] px-[72px] py-16 shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
        <h3 className="font-serif text-[32px] font-medium text-[#1a1a1a]">
          The Last Question
        </h3>
        <p className="mt-3 font-mono text-sm text-[#8a8178]">by Isaac Asimov</p>

        <div className="mt-12 space-y-8 text-[18px] leading-[1.65] text-[#2d2621]">
          {paragraphs.map((paragraph, index) => (
            <p key={paragraph} className="max-w-[692px]">
              {index === 3 ? (
                <>
                  The selected sentence is highlighted here to suggest a{" "}
                  <span className="rounded-lg bg-[#f5dacc] px-1.5 py-0.5">
                    deliberate translation moment
                  </span>{" "}
                  rather than always-on bilingual display.
                </>
              ) : (
                paragraph
              )}
            </p>
          ))}
        </div>
      </Card>

      <Card className="absolute left-[596px] top-[312px] w-[264px] bg-white p-[18px] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
        <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
          划词翻译
        </p>
        <h3 className="mt-3 max-w-[228px] font-serif text-[18px] font-medium leading-[1.3] text-[#1a1a1a]">
          deliberate translation moment
        </h3>
        <p className="mt-2 max-w-[228px] text-base font-semibold leading-[1.35] text-[#0d6e6e]">
          按需触发的翻译提示
        </p>
        <p className="mt-2 max-w-[228px] text-[13px] leading-[1.45] text-[#6a625a]">
          用户卡住时再看中文，避免阅读区长期双语并列。
        </p>
        <button
          type="button"
          className="mt-4 rounded-full bg-[#fff4ec] px-4 py-2 text-sm font-semibold text-[#c25b34]"
        >
          收藏词句
        </button>
      </Card>
    </Card>
  );
}
