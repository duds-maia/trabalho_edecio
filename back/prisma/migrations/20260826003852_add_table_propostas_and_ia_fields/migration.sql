-- CreateEnum
CREATE TYPE "Combustiveis" AS ENUM ('FLEX', 'GASOLINA', 'ETANOL', 'DIESEL', 'ELETRICO', 'HIBRIDO');

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carros" (
    "id" SERIAL NOT NULL,
    "modelo" VARCHAR(30) NOT NULL,
    "ano" SMALLINT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "km" INTEGER NOT NULL,
    "foto" TEXT NOT NULL,
    "acessorios" TEXT,
    "combustivel" "Combustiveis" NOT NULL DEFAULT 'FLEX',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT true,
    "marcaId" INTEGER NOT NULL,
    "pontosFortes" TEXT[],
    "pontosFracos" TEXT[],
    "consumoMedioCidade" DECIMAL(6,2),
    "consumoMedioEstrada" DECIMAL(6,2),

    CONSTRAINT "carros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "cidade" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas" (
    "id" SERIAL NOT NULL,
    "clienteId" VARCHAR(36) NOT NULL,
    "carroId" INTEGER NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "resposta" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- AddForeignKey
ALTER TABLE "carros" ADD CONSTRAINT "carros_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_carroId_fkey" FOREIGN KEY ("carroId") REFERENCES "carros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
