import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Categorias padrão
  const categorias = [
    {
      nome: 'Chaveiro',
      descricao: 'Serviços de abertura, cópia de chaves e reparos em fechaduras',
    },
    {
      nome: 'Encanador',
      descricao: 'Reparos e instalação de tubulações, canos e sistemas hidráulicos',
    },
    {
      nome: 'Eletricista',
      descricao: 'Reparos elétricos, instalação de fiação e manutenção de circuitos',
    },
    {
      nome: 'Vidraceiro',
      descricao: 'Colocação, reparos e limpeza de vidros e espelhos',
    },
    {
      nome: 'Ar-condicionado',
      descricao: 'Instalação, manutenção e reparos em sistemas de ar-condicionado',
    },
  ];

  for (const categoria of categorias) {
    const exists = await prisma.categoria.findUnique({
      where: { nome: categoria.nome },
    });

    if (!exists) {
      await prisma.categoria.create({
        data: categoria,
      });
      console.log(`Categoria criada: ${categoria.nome}`);
    } else {
      console.log(`Categoria já existe: ${categoria.nome}`);
    }
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro durante seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
