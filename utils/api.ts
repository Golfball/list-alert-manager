import Constants from "expo-constants";

export function getApiBaseUrl(): string {
  return (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? "http://localhost:3000";
}

export async function shareList(name: string, color: string, items: string[]): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}/api/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color, items }),
  });
  if (!res.ok) throw new Error("Failed to share list");
  const data = (await res.json()) as { code: string };
  return data.code;
}

export async function importList(code: string): Promise<{ name: string; color: string; items: string[] }> {
  const res = await fetch(`${getApiBaseUrl()}/api/share/${code.trim().toUpperCase()}`);
  if (res.status === 404) throw new Error("No list found for that code. It may have expired.");
  if (!res.ok) throw new Error("Failed to import list");
  return res.json() as Promise<{ name: string; color: string; items: string[] }>;
}
