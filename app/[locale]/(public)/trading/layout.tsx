import { FacetNav } from "@/components/facet-nav";

/** Không khai `metadata` ở đây: canonical đặt ở page, theo ràng buộc của repo. */
export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FacetNav facet="trading" />
      {children}
    </>
  );
}
