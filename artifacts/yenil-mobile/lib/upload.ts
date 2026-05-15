const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

type RNImagePayload = { uri: string; type: string; name: string };

export async function uploadImage(uri: string, filename = "upload.jpg"): Promise<string | null> {
  const form = new FormData();
  const file: RNImagePayload = { uri, type: "image/jpeg", name: filename };
  form.append("screenshot", file as unknown as Blob);
  const res = await fetch(`${API_BASE}/api/upload-screenshot`, { method: "POST", body: form });
  if (!res.ok) return null;
  const d = (await res.json()) as { secure_url?: string };
  return d.secure_url ?? null;
}
