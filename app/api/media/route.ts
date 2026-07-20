import { getConnectedConfig } from "@/lib/config";
import { getMedia } from "@/lib/ig";

export const runtime = "nodejs";

/** Lista os posts/reels da conta conectada (para o seletor visual). */
export async function GET() {
  const config = await getConnectedConfig();
  if (!config) {
    return Response.json({ data: [], error: "nao_conectado" });
  }
  try {
    const media = await getMedia(config.ig_user_id, config.access_token);
    return Response.json(media);
  } catch (e) {
    return Response.json({ data: [], error: String(e) });
  }
}
