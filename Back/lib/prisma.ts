import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada");

const urlBanco = new URL(databaseUrl);
if (urlBanco.searchParams.get("sslmode") === "require") {
  urlBanco.searchParams.set("sslmode", "verify-full");
}

const adapter = new PrismaPg({ connectionString: urlBanco.toString() });
const prisma = new PrismaClient({ adapter });

export { prisma };
