import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--color-primary)] flex flex-col justify-center items-center px-6 text-center">
      <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-10">
        <span className="text-[var(--color-primary)] font-bold text-sm">10MS</span>
      </div>
      <h1 className="text-[28px] font-bold text-white leading-tight mb-4">
        তোমার SSC 27<br/>রুটিন তৈরি করো
      </h1>
      <p className="text-white/80 text-[15px] mb-10 max-w-xs">
        মাত্র ৩ মিনিটে — তোমার নাম সহ PDF পাবে সরাসরি SMS-এ
      </p>
      <Link href="/wizard/info"
        className="cursor-pointer bg-white text-[var(--color-primary)] font-semibold text-[16px] px-8 py-3.5 rounded-[var(--radius-button)] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 animate-pulse-subtle">
        শুরু করো →
      </Link>
    </div>
  );
}
