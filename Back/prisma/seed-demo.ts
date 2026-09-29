import { randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma'
import { gerarHashSenha } from '../src/utils/auth'

const DATASET_PREFIX = 'DADOS-DEMO-2026'
const CLIENT_EMAIL_PREFIX = 'cliente.demo.'
const PROVIDER_EMAIL_PREFIX = 'prestador.demo.'
const DEMO_EMAIL_DOMAIN = 'mesocorre.example'

const clientNames = [
  'Ana Souza',
  'Bruno Lima',
  'Carla Mendes',
  'Diego Rocha',
  'Elisa Martins',
  'Felipe Nunes',
  'Gabriela Alves',
  'Henrique Costa',
  'Isabela Freitas',
  'João Ribeiro',
]

const providerNames = [
  'Alex Ferreira',
  'Beatriz Ramos',
  'Caio Oliveira',
  'Daniela Moreira',
  'Eduardo Campos',
  'Fernanda Lopes',
  'Gustavo Barros',
  'Helena Cardoso',
  'Igor Teixeira',
  'Juliana Moraes',
  'Kleber Pinto',
  'Larissa Fonseca',
  'Marcos Azevedo',
  'Natália Correia',
  'Otávio Duarte',
  'Patrícia Vieira',
  'Rafael Monteiro',
  'Sabrina Castro',
  'Tiago Farias',
  'Úrsula Andrade',
  'Vitor Carvalho',
  'Wesley Barbosa',
  'Yasmin Araújo',
  'Zeca Gonçalves',
  'Alice Rezende',
]

const reviewSets = [
  [5, 5, 5],
  [5, 5, 4],
  [5, 4, 4],
  [4, 4, 5],
  [4, 4, 4],
  [5, 4, 3],
]

const reviewComments = [
  'Atendimento rápido, cuidadoso e muito profissional.',
  'Chegou no horário combinado e resolveu o problema.',
  'Serviço bem executado e comunicação clara durante o atendimento.',
  'Profissional educado, organizado e eficiente.',
  'Boa experiência, com explicação detalhada do serviço realizado.',
  'O atendimento foi concluído com qualidade e preço justo.',
]

function demoEmail(prefix: string, index: number) {
  return `${prefix}${String(index + 1).padStart(2, '0')}@${DEMO_EMAIL_DOMAIN}`
}

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

async function datasetCounts() {
  const [clients, providers, reviews, requests] = await Promise.all([
    prisma.user.count({ where: { email: { startsWith: CLIENT_EMAIL_PREFIX, endsWith: `@${DEMO_EMAIL_DOMAIN}` } } }),
    prisma.providerProfile.count({
      where: { user: { email: { startsWith: PROVIDER_EMAIL_PREFIX, endsWith: `@${DEMO_EMAIL_DOMAIN}` } } },
    }),
    prisma.review.count({
      where: { provider: { user: { email: { startsWith: PROVIDER_EMAIL_PREFIX, endsWith: `@${DEMO_EMAIL_DOMAIN}` } } } },
    }),
    prisma.serviceRequest.count({ where: { description: { startsWith: `[${DATASET_PREFIX}:` } } }),
  ])

  return { clients, providers, reviews, requests }
}

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })
  if (categories.length === 0) {
    throw new Error('Nenhuma categoria encontrada. Execute npm run db:seed antes de cadastrar os dados demonstrativos.')
  }

  const before = await datasetCounts()
  const unavailablePasswordHash = await gerarHashSenha(randomBytes(32).toString('base64url'))

  await prisma.$transaction(
    async (transaction) => {
      const clients = []

      for (let index = 0; index < clientNames.length; index += 1) {
        const client = await transaction.user.upsert({
          where: { email: demoEmail(CLIENT_EMAIL_PREFIX, index) },
          update: {
            name: clientNames[index],
            phone: `(51) 99100-${String(index + 1).padStart(4, '0')}`,
            address: `Bairro Demonstração ${index + 1}, Porto Alegre - RS`,
            role: 'CLIENT',
          },
          create: {
            name: clientNames[index],
            email: demoEmail(CLIENT_EMAIL_PREFIX, index),
            password: unavailablePasswordHash,
            phone: `(51) 99100-${String(index + 1).padStart(4, '0')}`,
            address: `Bairro Demonstração ${index + 1}, Porto Alegre - RS`,
            role: 'CLIENT',
            createdAt: dateDaysAgo(120 - index * 4),
          },
        })
        clients.push(client)
      }

      const providers = []

      for (let index = 0; index < providerNames.length; index += 1) {
        const category = categories[index % categories.length]
        const approvalStatus = index < 18 ? 'APPROVED' : index < 22 ? 'SUSPENDED' : 'BANNED'
        const email = demoEmail(PROVIDER_EMAIL_PREFIX, index)
        const user = await transaction.user.upsert({
          where: { email },
          update: {
            name: providerNames[index],
            phone: `(51) 99200-${String(index + 1).padStart(4, '0')}`,
            address: `Região de atendimento ${index + 1}, Porto Alegre - RS`,
            role: 'PROVIDER',
          },
          create: {
            name: providerNames[index],
            email,
            password: unavailablePasswordHash,
            phone: `(51) 99200-${String(index + 1).padStart(4, '0')}`,
            address: `Região de atendimento ${index + 1}, Porto Alegre - RS`,
            role: 'PROVIDER',
            createdAt: dateDaysAgo(200 - index * 3),
          },
        })

        const provider = await transaction.providerProfile.upsert({
          where: { userId: user.id },
          update: {
            categoryId: category.id,
            approvalStatus,
            isAvailable: approvalStatus === 'APPROVED',
            isFeatured: approvalStatus === 'APPROVED' && index % 5 === 0,
            address: `Região de atendimento ${index + 1}, Porto Alegre - RS`,
          },
          create: {
            userId: user.id,
            categoryId: category.id,
            approvalStatus,
            isAvailable: approvalStatus === 'APPROVED',
            isFeatured: approvalStatus === 'APPROVED' && index % 5 === 0,
            address: `Região de atendimento ${index + 1}, Porto Alegre - RS`,
            createdAt: dateDaysAgo(200 - index * 3),
          },
        })
        providers.push(provider)
      }

      for (let providerIndex = 0; providerIndex < providers.length; providerIndex += 1) {
        const provider = providers[providerIndex]
        const ratings = reviewSets[providerIndex % reviewSets.length]

        for (let reviewIndex = 0; reviewIndex < 3; reviewIndex += 1) {
          const client = clients[(providerIndex * 3 + reviewIndex) % clients.length]
          const marker = `[${DATASET_PREFIX}:P${String(providerIndex + 1).padStart(2, '0')}:R${reviewIndex + 1}]`
          const createdAt = dateDaysAgo(90 - ((providerIndex * 3 + reviewIndex) % 80))
          const existingRequest = await transaction.serviceRequest.findFirst({
            where: { description: { startsWith: marker } },
          })
          const requestData = {
            clientId: client.id,
            providerId: provider.id,
            categoryId: provider.categoryId,
            description: `${marker} Serviço demonstrativo concluído.`,
            address: client.address ?? 'Porto Alegre - RS',
            serviceType: 'IMMEDIATE' as const,
            status: 'COMPLETED' as const,
            finalPrice: String(110 + providerIndex * 7 + reviewIndex * 15),
            createdAt,
          }
          const request = existingRequest
            ? await transaction.serviceRequest.update({ where: { id: existingRequest.id }, data: requestData })
            : await transaction.serviceRequest.create({ data: requestData })

          await transaction.review.upsert({
            where: { requestId: request.id },
            update: {
              clientId: client.id,
              providerId: provider.id,
              rating: ratings[reviewIndex],
              comment: reviewComments[(providerIndex + reviewIndex) % reviewComments.length],
              createdAt,
            },
            create: {
              requestId: request.id,
              clientId: client.id,
              providerId: provider.id,
              rating: ratings[reviewIndex],
              comment: reviewComments[(providerIndex + reviewIndex) % reviewComments.length],
              createdAt,
            },
          })
        }

        const aggregate = await transaction.review.aggregate({
          where: { providerId: provider.id },
          _avg: { rating: true },
          _count: true,
        })
        await transaction.providerProfile.update({
          where: { id: provider.id },
          data: {
            ratingAverage: aggregate._avg.rating ?? 0,
            aiSummary: null,
            aiSummaryReviewCount: 0,
          },
        })
      }

      const extraRequestStatuses = [
        'PENDING',
        'PENDING',
        'PENDING',
        'ACCEPTED',
        'ACCEPTED',
        'IN_PROGRESS',
        'IN_PROGRESS',
        'CANCELLED',
        'CANCELLED',
        'CANCELLED',
      ] as const

      for (let index = 0; index < extraRequestStatuses.length; index += 1) {
        const provider = providers[index]
        const client = clients[index]
        const marker = `[${DATASET_PREFIX}:FLUXO:${String(index + 1).padStart(2, '0')}]`
        const requestData = {
          clientId: client.id,
          providerId: provider.id,
          categoryId: provider.categoryId,
          description: `${marker} Solicitação demonstrativa para o painel.`,
          address: client.address ?? 'Porto Alegre - RS',
          serviceType: index % 2 === 0 ? ('IMMEDIATE' as const) : ('SCHEDULED' as const),
          scheduledAt: index % 2 === 0 ? null : dateDaysAgo(-7 - index),
          status: extraRequestStatuses[index],
          finalPrice: null,
          createdAt: dateDaysAgo(12 - index),
        }
        const existingRequest = await transaction.serviceRequest.findFirst({
          where: { description: { startsWith: marker } },
        })

        if (existingRequest) {
          await transaction.serviceRequest.update({ where: { id: existingRequest.id }, data: requestData })
        } else {
          await transaction.serviceRequest.create({ data: requestData })
        }
      }
    },
    { maxWait: 20_000, timeout: 120_000 },
  )

  const after = await datasetCounts()
  const demoProviders = await prisma.providerProfile.findMany({
    where: { user: { email: { startsWith: PROVIDER_EMAIL_PREFIX, endsWith: `@${DEMO_EMAIL_DOMAIN}` } } },
    select: { id: true, _count: { select: { reviews: true } } },
  })
  const providersWithoutThreeReviews = demoProviders.filter((provider) => provider._count.reviews < 3)

  if (after.clients !== 10 || after.providers !== 25 || after.reviews < 75 || providersWithoutThreeReviews.length > 0) {
    throw new Error(`Validação do conjunto demonstrativo falhou: ${JSON.stringify(after)}`)
  }

  console.log('Dados demonstrativos cadastrados sem remover registros existentes.')
  console.table({ antes: before, depois: after })
  console.log('Validação concluída: 10 clientes, 25 prestadores e pelo menos 3 avaliações por prestador.')
}

main()
  .catch((error) => {
    console.error('Erro ao cadastrar dados demonstrativos:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
