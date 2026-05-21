import DiamondGuidePage from "@/components/diamond-guide/DiamondGuidePage";
import guide from "@/data/diamondGuide.json";

export const metadata = {
  title: `${guide.hero.pageTitle} | Pradeep Jewellers`,
  description: guide.meta.description,
};

export default function DiamondGuideRoute() {
  return <DiamondGuidePage />;
}
