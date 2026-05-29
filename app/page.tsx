import { Hero115 } from "@/components/hero115";
import { Feature17 } from "@/components/feature17";
import { Pricing6 } from "@/components/pricing6";
import { Footer2 } from "@/components/footer2";


export default function Home() {
  return (
    
      <div className="flex w-full flex-col items-center gap-6 md:gap-10 ">
        <Hero115 />
        <Pricing6 />
        <Feature17 />
        <Footer2 className="w-full" />
      </div>

  );
}