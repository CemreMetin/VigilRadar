import type { NextConfig } from "next";

// Static export: the site is plain files on a CDN. All "server work" happens in
// worker/ and lands in public/data/ (see SPEC.md §7.0).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  // With inlining on (the 16.3 default) the client asks for flattened segment files such as
  // /survive/__next.survive.__PAGE__.txt, which a static export does not write: every prefetch 404ed.
  experimental: { prefetchInlining: false },
};

export default nextConfig;
