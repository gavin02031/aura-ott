import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type LikedItem = {
  id?: number | string;
  title?: string;
  mediaType?: "movie" | "tv" | string;
  genres?: string[];
  overview?: string;
};

type CandidateItem = {
  id: number;
  title?: string;
  name?: string;
  media_type?: "movie" | "tv" | string;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
  popularity?: number;
};

type RequestBody = {
  likedItems?: LikedItem[];
  candidates?: CandidateItem[];
  limitPerRow?: number;
  avoidStrength?: "strong" | "light";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return jsonResponse(500, { error: "Missing GROQ_API_KEY secret" });
    }

    const body = (await req.json()) as RequestBody;
    const likedItems = Array.isArray(body.likedItems) ? body.likedItems : [];
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const limitPerRow = Math.max(1, Math.min(30, Number(body.limitPerRow) || 15));
    const avoidStrength = body.avoidStrength === "light" ? "light" : "strong";

    if (!likedItems.length || !candidates.length) {
      return jsonResponse(200, {
        preferredGenres: [],
        avoidGenres: [],
        picks: [],
        rowTitle: "Because you watch",
      });
    }

    // Keep payload small and deterministic.
    const trimmedLiked = likedItems.slice(0, 30).map((i) => ({
      id: i.id,
      title: i.title,
      mediaType: i.mediaType,
      genres: Array.isArray(i.genres) ? i.genres.slice(0, 8) : [],
      overview: (i.overview ?? "").slice(0, 250),
    }));

    const trimmedCandidates = candidates.slice(0, 160).map((c) => ({
      id: c.id,
      title: c.title || c.name || `#${c.id}`,
      media_type: c.media_type || "movie",
      overview: (c.overview ?? "").slice(0, 220),
      genre_ids: Array.isArray(c.genre_ids) ? c.genre_ids.slice(0, 8) : [],
      vote_average: c.vote_average ?? null,
      popularity: c.popularity ?? null,
    }));

    const prompt =
      "You are a recommendation brain for a premium streaming app.\n" +
      "Do 2 things:\n" +
      "1) infer preferredGenres and avoidGenres from likedItems.\n" +
      "2) choose the best candidate IDs from candidates.\n\n" +
      `Avoid strength is '${avoidStrength}'. If strong, avoid disliked vibes aggressively.\n` +
      `Return EXACT JSON (no markdown): {"preferredGenres":[string], "avoidGenres":[string], "picks":[number], "rowTitle":string}\n` +
      `Rules:\n` +
      `- picks must contain up to ${limitPerRow} candidate IDs from candidates only.\n` +
      `- prioritize diversity, novelty, and match quality.\n` +
      `- keep rowTitle short and premium.\n\n` +
      `likedItems JSON:\n${JSON.stringify(trimmedLiked)}\n\n` +
      `candidates JSON:\n${JSON.stringify(trimmedCandidates)}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You only return valid JSON. Never include code fences or extra text.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const txt = await groqRes.text();
      return jsonResponse(502, {
        error: "Groq request failed",
        status: groqRes.status,
        detail: txt.slice(0, 600),
      });
    }

    const groqJson = await groqRes.json();
    const content = groqJson?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return jsonResponse(200, {
        preferredGenres: [],
        avoidGenres: [],
        picks: [],
        rowTitle: "Because you watch",
      });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed || typeof parsed !== "object") {
      return jsonResponse(200, {
        preferredGenres: [],
        avoidGenres: [],
        picks: [],
        rowTitle: "Because you watch",
      });
    }

    const candidateIdSet = new Set(trimmedCandidates.map((c) => Number(c.id)));
    const picks = Array.isArray(parsed.picks)
      ? parsed.picks
          .map((v: unknown) => Number(v))
          .filter((v: number) => Number.isFinite(v) && candidateIdSet.has(v))
          .slice(0, limitPerRow)
      : [];

    return jsonResponse(200, {
      preferredGenres: Array.isArray(parsed.preferredGenres)
        ? parsed.preferredGenres.slice(0, 8)
        : [],
      avoidGenres: Array.isArray(parsed.avoidGenres)
        ? parsed.avoidGenres.slice(0, 8)
        : [],
      picks,
      rowTitle:
        typeof parsed.rowTitle === "string" && parsed.rowTitle.trim()
          ? parsed.rowTitle.slice(0, 60)
          : "Because you watch",
    });
  } catch (err) {
    return jsonResponse(500, {
      error: "Unexpected server error",
      detail: String((err as Error)?.message || err),
    });
  }
});

