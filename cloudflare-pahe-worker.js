export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url");
    const referer = requestUrl.searchParams.get("referer") || "https://kwik.cx/";
    const origin = requestUrl.searchParams.get("origin") || new URL(referer).origin;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!target) {
      return new Response("Missing 'url' param", {
        status: 400,
        headers: corsHeaders,
      });
    }

    try {
      const upstreamHeaders = new Headers();
      upstreamHeaders.set("Referer", referer);
      upstreamHeaders.set("Origin", origin);
      upstreamHeaders.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      const range = request.headers.get("Range");
      if (range) upstreamHeaders.set("Range", range);

      const upstream = await fetch(target, {
        method: request.method === "HEAD" ? "HEAD" : "GET",
        headers: upstreamHeaders,
      });

      const responseHeaders = new Headers(corsHeaders);
      const contentType = upstream.headers.get("content-type") || "";
      const lowerTarget = target.toLowerCase();
      const isM3u8 = contentType.includes("mpegurl") || lowerTarget.includes(".m3u8");
      const isSegment =
        lowerTarget.includes("segment") ||
        lowerTarget.endsWith(".jpg") ||
        lowerTarget.endsWith(".ts");

      if (!upstream.ok) {
        return new Response(`Origin error: ${upstream.status}`, {
          status: upstream.status,
          headers: responseHeaders,
        });
      }

      if (isM3u8) {
        const text = await upstream.text();
        const proxify = (value) => {
          const absolute = new URL(value, target).href;
          const proxyUrl = new URL(requestUrl.origin + requestUrl.pathname);
          proxyUrl.searchParams.set("referer", referer);
          proxyUrl.searchParams.set("origin", origin);
          proxyUrl.searchParams.set("url", absolute);
          return proxyUrl.href;
        };

        const rewritten = text
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (!trimmed.startsWith("#")) return proxify(trimmed);

            return line.replace(/URI="([^"]+)"/g, (_, uri) => {
              return `URI="${proxify(uri)}"`;
            });
          })
          .join("\n");

        responseHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
        responseHeaders.set("Cache-Control", "no-store");
        return new Response(rewritten, {
          status: upstream.status,
          headers: responseHeaders,
        });
      }

      const passthroughHeaders = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
        "etag",
        "last-modified",
      ];

      for (const header of passthroughHeaders) {
        const value = upstream.headers.get(header);
        if (value) responseHeaders.set(header, value);
      }

      if (!responseHeaders.has("Content-Type")) {
        responseHeaders.set("Content-Type", "application/octet-stream");
      }

      if (isSegment) {
        responseHeaders.set("Content-Type", "video/mp2t");
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response("Proxy error: " + error.message, {
        status: 502,
        headers: corsHeaders,
      });
    }
  },
};
