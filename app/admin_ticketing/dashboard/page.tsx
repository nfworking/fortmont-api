import { TicketDashboard } from '@/components/ticketing/admin/ticket-dashboard';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const res = await fetch("https://api.fortmont.me/api/ticketing/get/ticket", {
    cache: "no-store",
    credentials: "include",
  });

  const tickets = await res.json();
  const users = await prisma.appUsers.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      avatarUrl: true,
      phone: true,
      isEntraUser: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      onboarded: true,
    },
    orderBy: {
      displayName: 'asc',
    },
  });

  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return <TicketDashboard tickets={tickets} users={serializedUsers} />;
}
