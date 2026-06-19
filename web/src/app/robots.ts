import type { MetadataRoute } from "next";

const BASE_URL = "https://www.burpeepacers.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/dashboard", "/account", "/settings", "/admin"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
