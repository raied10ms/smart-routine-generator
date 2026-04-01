"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CapturePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [roll, setRoll] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.routinePreview) router.push("/wizard/duration");
  }, [router]);

  async function handleSubmit() {
    if (!phone.trim()) return;
    setSubmitting(true);

    // Secret test code: "1234" opens printable routine in new tab
    if (phone.trim() === "1234") {
      window.open("/api/pdf/test", "_blank");
      setSubmitting(false);
      return;
    }

    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saved.name, phone: phone.trim(), school: school.trim(),
        classRoll: roll.trim(), section: saved.section, devicePreference: device,
        durationDays: saved.durationDays, assessment: saved.assessment, routine: saved.routinePreview,
      }),
    });
    if (res.ok) {
      sessionStorage.removeItem("wizard");
      router.push("/success");
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* <!-- secret: enter 1234 as phone for test PDF --> */}
      <h1 className="text-[22px] font-bold mb-2">একটু তথ্য দাও</h1>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-6">PDF আসছে SMS-এ</p>
      <div className="flex flex-col gap-4 mb-6">
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="তোমার নম্বর"
          className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
        <p className="text-[11px] text-[var(--color-text-muted)] -mt-2">তোমার নম্বর শুধু PDF পাঠাতে ব্যবহার হবে।</p>
        <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="তোমার স্কুলের নাম"
          className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
        <input type="text" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="ক্লাস রোল"
          className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
        <div>
          <span className="text-[14px] text-[var(--color-text-muted)] mb-2 block">রুটিন কিভাবে দেখবে?</span>
          <div className="flex gap-2">
            {(["mobile", "desktop"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDevice(d)}
                className={`cursor-pointer flex-1 py-2.5 rounded-[var(--radius-pill)] text-[14px] font-medium transition-colors hover:opacity-80 ${
                  device === d ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)]"
                }`}>{d === "mobile" ? "📱 Mobile এ দেখব" : "🖨️ Print করে নিব"}</button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleSubmit} disabled={!phone.trim() || submitting}
        className="cursor-pointer w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] disabled:opacity-40 hover:bg-[var(--color-primary)]/90 transition-colors">
        {submitting ? "পাঠানো হচ্ছে..." : "PDF পাঠাও →"}
      </button>
    </div>
  );
}
