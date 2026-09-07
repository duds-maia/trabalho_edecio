import express from 'express'
import cors from 'cors'
import rotasAdmin from './routes/admin'
import rotasAutenticacao from './routes/autenticacao'
import rotasAvaliacoes from './routes/avaliacoes'
import rotasCategorias from './routes/categories'
import rotasClientes from './routes/clientes'
import rotasPrestadores from './routes/providers'
import rotasSolicitacoes from './routes/solicitacoes'
import { rotaNaoEncontrada, tratarErro } from './middlewares/erro.middleware'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())
app.use(cors())

app.use('/auth', rotasAutenticacao)
app.use('/admin', rotasAdmin)
app.use('/reviews', rotasAvaliacoes)
app.use('/categories', rotasCategorias)
app.use('/clients', rotasClientes)
app.use('/providers', rotasPrestadores)
app.use('/requests', rotasSolicitacoes)

app.get('/', (_req, res) => {
  res.json({ name: 'Me Socorre API', status: 'ok' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(rotaNaoEncontrada)
app.use(tratarErro)

export { app }

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
  })
}
