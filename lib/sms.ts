export async function sendSms(phone: string, message: string): Promise<boolean> {
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;
  if (!url || !key) {
    console.warn("SMS not configured — skipping send to", phone);
    return false;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ phone, message }),
  });

  return res.ok;
}
