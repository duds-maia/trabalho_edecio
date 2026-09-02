import express from 'express';
import cors from 'cors';
import { prisma } from '../lib/prisma';

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'a senha é senha',
  });
});

// Rota para listar categorias
app.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.categoria.findMany();
    res.status(200).json({
      success: true,
      total: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar categorias',
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});