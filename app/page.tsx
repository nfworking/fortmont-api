import { Hero115 } from "@/components/hero115";
import { Feature17 } from "@/components/feature17";
import { Pricing6 } from "@/components/pricing6";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-6 pt-6 md:gap-10">
      <Hero115 />
      <Feature17 />
      <Pricing6 />

    </div>
  )
}