import { prisma } from "../../lib/prisma"

import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const marcaSchema = z.object({
  nome: z.string().min(3,
    { message: "Modelo deve possuir, no mínimo, 3 caracteres" })
})

router.get("/", async (req, res) => {
  try {
    const marcas = await prisma.marca.findMany()
    res.status(200).json(marcas)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = marcaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome } = valida.data

  try {
    const marca = await prisma.marca.create({
      data: { nome }
    })
    res.status(201).json(marca)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const marca = await prisma.marca.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(marca)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = marcaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome } = valida.data

  try {
    const marca = await prisma.marca.update({
      where: { id: Number(id) },
      data: { nome }
    })
    res.status(200).json(marca)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router