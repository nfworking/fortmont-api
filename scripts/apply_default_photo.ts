// scripts/set-default-avatars.ts
import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.appUsers.updateMany({
    where: {
      avatarUrl: "/images/profile_default.jpg",
    },
    data: {
      avatarUrl: "/defaults/profile_default.jpg",
    },
  });

  console.log(`Updated ${result.count} users`);
}

main()
  .finally(() => prisma.$disconnect());