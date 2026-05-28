import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

interface PricingSinglePlan {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  period?: { monthly: string; yearly: string };
  features: string[];
  button: { text: string; url: string };
  secondaryButton?: { text: string; url: string };
  featureListLabel?: string;
  image?: string;
  badge?: string;
  priceNote?: string;
}

interface PricingSingleProps {
  heading: string;
  description: string;
  plan: PricingSinglePlan;
  className?: string;
}

interface Pricing6Props extends PricingSingleProps {
  /** Grouped features rendered as separated sections instead of a flat list. */
  featureGroups?: string[][];
}
type Props = Partial<Pricing6Props>;

const defaultProps: Pricing6Props = {
  heading: "Dont want to self host? We got you covered",
  description: "One plan hosted on our infrastructure, cancel anytime.",
  plan: {
    name: "Standard",
    image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/pricing-plans/plan2.svg",
    description:
      "For individual developers and side projects shipping real interfaces.",
    monthlyPrice: "$7.80",
    yearlyPrice: "$78",
    period: { monthly: "/month", yearly: "/year" },
    badge: "Most popular",
    featureListLabel: "Includes",
    features: [      
      "20GB storage space"  
    ],
    button: {
      text: "Contact Us",
      url: "https://auto.fortmont.me/form/1680ac70-74b8-4c55-84f0-259dbaa1b818",
    },
    secondaryButton: {
      text: "Talk to sales",
      url: "#",
    },
  },
  featureGroups: [
    ["Unlimited Users", "Integrations with third-party tools", "Discord Support"],
    ["Agent Setup", "Hardware Customization", "Multiple API Keys"],
    
  ],
};

const Pricing6 = (props: Props) => {
  const { heading, description, plan, featureGroups, className } = {
    ...defaultProps,
    ...props,
  };
  const periodMonthly = plan.period?.monthly ?? "/mo";

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty lg:text-5xl">
            {heading}
          </h2>
          <p className="max-w-md text-muted-foreground lg:text-xl">
            {description}
          </p>
          <div className="mx-auto mt-4 flex w-full flex-col rounded-lg border p-6 sm:w-fit sm:min-w-100">
            <div className="flex justify-center">
              <span className="text-lg font-semibold">$</span>
              <span className="text-6xl font-medium tracking-tighter lg:text-7xl">
                {plan.monthlyPrice.replace(/^\$/, "")}
              </span>
              <span className="self-end text-muted-foreground">
                {periodMonthly}
              </span>
            </div>
            <div className="my-6">
              {(featureGroups ?? [plan.features]).map((featureGroup, idx) => (
                <div key={idx}>
                  <ul className="flex flex-col gap-3">
                    {featureGroup.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 text-sm font-medium"
                      >
                        {feature} <Check className="inline size-4 shrink-0" />
                      </li>
                    ))}
                  </ul>
                  {idx < (featureGroups ?? [plan.features]).length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </div>
            <Button asChild>
              <a href={plan.button.url} target="_blank" rel="noreferrer">
                {plan.button.text}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing6 };
