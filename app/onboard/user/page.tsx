import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingFlow from "@/components/onboard/onboard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true },
  });

  if (user?.onboarded) {
    redirect("/dashboard"); // or wherever they should go
  }

  return <OnboardingFlow />;
}