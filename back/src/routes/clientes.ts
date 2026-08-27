import { prisma } from "../../lib/prisma"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'

const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(10, {
    message: "Nome do cliente deve possuir, no mínimo, 10 caracteres"
  }),
  email: z.string().email({message: "Informe um e-mail válido"}),
  senha: z.string(),
  cidade: z.string()
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(400).json(error)
  }
})

function validaSenha(senha: string) {

  const mensa: string[] = []

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  // contadores
  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)")
  }

  return mensa
}

router.post("/", async (req, res) => {

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

 // Verificação de e-mail duplicado
  const verificaCliente = await prisma.cliente.findUnique({
    where: { email: valida.data.email }
  })
  if (verificaCliente) {
    res.status(400).json({ erro: "E-mail já cadastrado" })
    return
  }

  const erros = validaSenha(valida.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(valida.data.senha, salt)
 
  const { nome, email, cidade } = valida.data

  // para o campo senha, atribui o hash gerado
  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: hash, cidade }
    })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json({erro: error})
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router