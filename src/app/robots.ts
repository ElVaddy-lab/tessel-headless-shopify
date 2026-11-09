import type { MetadataRoute } from "next";

// Demo store: keep it out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
