import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-6 text-center">
      <img src="/10ms-logo.svg" alt="10 Minute School" className="h-6 absolute top-4 left-1/2 -translate-x-1/2" />
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-6">
        <span className="text-[var(--color-primary)] text-4xl">✓</span>
      </div>
      <h1 className="text-[22px] font-bold mb-3">রুটিন পাঠানো হয়েছে!</h1>
      <p className="text-[var(--color-text-muted)] text-[15px] mb-8 max-w-xs">
        তোমার নম্বরে SMS গেছে। PDF download করো এবং নাম লিখে শুরু করো আজই।
      </p>
      <a href="https://wa.me/?text=আমি%20SSC%2027%20এর%20জন্য%20personalized%20রুটিন%20তৈরি%20করেছি!%20তুমিও%20তৈরি%20করো%20👉"
        className="cursor-pointer bg-[#25D366] text-white font-semibold px-6 py-3 rounded-[var(--radius-button)] mb-4 text-[14px] hover:bg-[#1fb855] transition-colors" target="_blank">
        বন্ধুকে পাঠাও
      </a>
      <Link href="/" className="cursor-pointer text-[var(--color-primary)] text-[14px] font-medium hover:underline transition-all">আবার শুরু করো</Link>
    </div>
  );
}
