import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  password: "ridealong",
  database: "fortmontapi",
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({ adapter });