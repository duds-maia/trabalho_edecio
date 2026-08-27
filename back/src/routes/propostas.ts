import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from 'zod'

const router = Router()

const propostaSchema = z.object({
  clienteId: z.string(),
  carroId: z.number(),
  descricao: z.string().min(10,
    { message: "Descrição da Proposta deve possuir, no mínimo, 10 caracteres" }),
})

router.get("/", async (req, res) => {
  try {
    const propostas = await prisma.proposta.findMany({
      include: {
        cliente: true,
        carro: {
          include: {
            marca: true
          }
        }
      },
      orderBy: { id: 'desc'}
    })
    res.status(200).json(propostas)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", async (req, res) => {

  const valida = propostaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }  
  const { clienteId, carroId, descricao } = valida.data

  try {
    const proposta = await prisma.proposta.create({
      data: { clienteId, carroId, descricao }
    })
    res.status(201).json(proposta)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params
  try {
    const propostas = await prisma.proposta.findMany({
      where: { clienteId },
      include: {
        carro: {
          include: {
            marca: true
          }
        }
      }
    })
    res.status(200).json(propostas)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router