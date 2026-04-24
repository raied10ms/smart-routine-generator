import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh sg-hero flex flex-col justify-center items-center px-6 text-center relative z-10">
      <img src="/10ms-logo-white.svg" alt="10 Minute School" className="h-6 mb-10" />

      <div className="inline-flex items-center gap-2 bg-ten-red/15 border border-ten-red/40 text-ten-red font-semibold text-xs px-3 py-1.5 rounded-full mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-ten-red inline-block live-dot" />
        SSC · HSC · Smart Routine
      </div>

      <h1 className="text-[28px] sm:text-[38px] font-bold text-white leading-tight tracking-tight mb-4">
        তোমার স্মার্ট রুটিন<br />বানিয়ে নাও
      </h1>
      <p className="text-white/75 text-[15px] sm:text-[17px] mb-10 max-w-xs">
        মাত্র ৩ মিনিটে — নাম সহ Personalized রুটিন ও PDF
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
        <Link
          href="/wizard/info"
          className="btn-primary btn-pulse text-[16px] px-6 py-3.5 rounded-[10px] flex-1"
        >
          শুরু করো →
        </Link>
      </div>

      <p className="text-white/30 text-xs mt-6">কোনো SMS নেই · সরাসরি PDF Download</p>
    </div>
  );
}
