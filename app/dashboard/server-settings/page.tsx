import { TypingAnimation } from "@/components/ui/typing-animation";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont Server Settings",
  description: "Dashboard for managing your Fortmont server and its users.",
};

export default function ServerSettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <TypingAnimation>Server Settings Page - Under Construction 🚧</TypingAnimation>
    </main>
  );
}