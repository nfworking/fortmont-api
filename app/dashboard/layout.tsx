import { ApplicationShell1 } from "@/components/application-shell1";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardBackground } from "@/components/dashboard_res/background";
import Image from "next/image";
import {SessionProvider} from "next-auth/react"
import { TicketModalProvider } from "@/components/ticket-modal-context";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const sessionUser = session?.user as
    | {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }
    | undefined;

  const userId = sessionUser?.id?.trim() ?? undefined;
  const email = session?.user?.email?.trim().toLowerCase();
  const username = session?.user?.name?.trim().toLowerCase();

  const user =
    userId || email || username
      ? await prisma.appUsers.findFirst({
          where: {
            OR: [
              ...(userId ? [{ id: userId }] : []),
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
          select: {
            displayName: true,
            email: true,
            avatarUrl: true,
            githubLink: {select: { username: true } },
          },
        })
      : null;

  return (

      <div className="relative min-h-screen w-full">
            <SessionProvider session={session}>
      <TicketModalProvider>
        {/* Fixed background layer */}
        

      {/* App shell sits on top */}
      <ApplicationShell1 
        user={
          user
            ? {
                name: user.displayName ?? session?.user?.name ?? null,
                email: user.email ?? session?.user?.email ?? null,
                avatar: user.avatarUrl ?? sessionUser?.image ?? null,
                isGithubLinked: user.githubLink?.[0]?.username !== undefined,
              }
            : session?.user ?? null
        }
      >
        {children}
      </ApplicationShell1>
      </TicketModalProvider>
      </SessionProvider>
    </div>
    
  );
}