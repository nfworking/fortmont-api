import {
  Blocks,
  ChartLine,
  Globe,
  Layers,
  Lock,
  Palette,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface FeatureIconListItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
}
interface Button {
  text: string;
  url: string;
  icon?: React.ReactNode;
}
interface Buttons {
  primary?: Button;
  secondary?: Button;
}

interface FeatureIconListProps {
  heading: string;
  label?: string;
  features?: FeatureIconListItem[];
  buttons?: Buttons;
  className?: string;
}

interface Feature17Props extends FeatureIconListProps {}
type Props = Partial<Feature17Props>;

const defaultProps: Feature17Props = {
  heading: "Keep up to date in your Homelab with production ready API",
  label: "Features",
  features: [
    {
      icon: <Zap className="size-5" />,
      title: "Full Source Code",
      description:
        "The entire codebase in open source on GitHub. No closed source components, no hidden dependencies.",
    },
    {
      icon: <Palette className="size-5" />,
      title: "Responsive Design",
      description:
        "Every block adapts seamlessly from mobile to desktop with Tailwind's mobile-first utility classes.",
    },
    {
      icon: <Shield className="size-5" />,
      title: "Security Focused",
      description:
        "Built with best practices and minimal dependencies to reduce attack surface. Regularly audited and updated.",
    },
    {
      icon: <Settings className="size-5" />,
      title: "Full admin Control",
      description:
        "Information and entries can be easily managed through the API or the dashboard. You have full control over your data and how you want to manage it.",
    },
    {
      icon: <Layers className="size-5" />,
      title: "Customizable",
      description:
        "Source is open, so you can customize it to fit your needs. Add new features, modify existing ones, or integrate with other tools in your homelab.",
    },
    {
      icon: <Rocket className="size-5" />,
      title: "Production Ready",
      description:
        "Battle-tested in real projects. No placeholder hacks, no lorem ipsum — clean code you run in your lab.",
    },
  ],
  buttons: {
    primary: {
      text: "Browse Components",
      url: "https://www.shadcnblocks.com",
    },
  },
};

const MAX_FEATURES = 6;

const Feature17 = (props: Props) => {
  const { heading, label, features, buttons, className } = {
    ...defaultProps,
    ...props,
  };
  const items = (features ?? []).slice(0, MAX_FEATURES);

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        {(label || heading) && (
          <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center">
            {label && <Badge variant="secondary">{label}</Badge>}
            <h2 className="text-3xl font-semibold tracking-tight text-pretty md:text-4xl lg:text-5xl">
              {heading}
            </h2>
          </div>
        )}
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
          {items.map((feature, idx) => (
            <div
              key={idx}
              className="flex gap-6 rounded-lg md:block md:space-y-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent md:size-12">
                {feature.icon}
              </span>
              <div>
                <h3 className="font-medium tracking-tight md:mb-2 md:text-xl">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground md:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        {buttons?.primary?.url && (
          <div className="mt-16 flex justify-center">
            <Button size="lg" asChild>
              <a href={buttons.primary.url}>{buttons.primary.text}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export { Feature17 };
