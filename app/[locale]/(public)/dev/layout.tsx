import { FacetNav } from "@/components/facet-nav";

/** Không khai `metadata` ở đây: canonical đặt ở page, theo ràng buộc của repo. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FacetNav facet="dev" />
      {children}
    </>
  );
}
