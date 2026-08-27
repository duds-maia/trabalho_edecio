import { prisma } from "../lib/prisma";
import { type Prisma } from "../generated/prisma/client"

const marcas: Prisma.MarcaCreateInput[] = [
    {
        nome: "Fiat"
    },
    {
        nome: "Volkswagen"
    },
    {
        nome: "Renault"
    },
    {
        nome: "Hiunday"
    },
    {
        nome: "Nissan"
    },
    {
        nome: "Honda"
    },
    {
        nome: "Peugeot"
    },
    {
        nome: "Ford"
    },
    {
        nome: "BYD"
    },
    {
        nome: "Citroen"
    },
    {
        nome: "Toyota"
    }
]

const carros: Prisma.CarroCreateInput[] = [
    {
        "modelo": "Pulse",
        "ano": 2021,
        "preco": 98500,
        "km": 32000,
        "foto": "https://resized-images.autoconf.com.br/1440x0/filters:format(webp)/veiculos/fotos/1077576/56f2e215-4bf8-4ef6-9a93-c960748ff678.jpg",
        "acessorios": "Airbag motorista, Airbag passageiro, Ar-condicionado, Bancos de couro",
        "marcaId": 1
    },
    {
        "modelo": "Taos",
        "ano": 2021,
        "preco": 125000,
        "km": 35000,
        "foto": "https://resized-images.autoconf.com.br/1440x0/filters:format(webp)/veiculos/fotos/1013840/bb8d1694-51c8-49f6-ae9f-31dbb77765be.jpg",
        "acessorios": "Airbag motorista, Airbag passageiro, Ar-condicionado, Bancos de couro e Direção elétrica",
        "marcaId": 2
    },
    {
        "modelo": "Creta",
        "ano": 2018,
        "preco": 79500,
        "km": 110000,
        "foto": "https://resized-images.autoconf.com.br/1440x0/filters:format(webp)/veiculos/fotos/1075712/75dbfb5e-ba05-4714-9767-fc277240c0ff.jpg",
        "acessorios": "Airbag motorista, Airbag passageiro, Ar-condicionado, Bancos de couro, Conexão Bluetooth, Desembaçador traseiro, Encosto de cabeça traseiro, Kit Multimídia, Limpador traseiro",
        "marcaId": 4
    },
    {
        "modelo": "Dolphin",
        "ano": 2026,
        "preco": 149000,
        "km": 0,
        "foto": "https://resized-images.autoconf.com.br/1440x0/filters:format(webp)/veiculos/fotos/951530/aee696e1-6271-4e8a-bae0-31187e5fc673.jpg",
        "acessorios": "Airbag motorista, Airbag passageiro, Ar-condicionado, Bancos de couro, Conexão Bluetooth, Desembaçador traseiro, Encosto de cabeça traseiro, Kit Multimídia, Volante Multifunção, Volante revestidos em couro",
        "marcaId": 9
    },
]

async function main() {
    try {
        await prisma.marca.createMany({ data: marcas })
        console.log(`${marcas.length} Marcas Cadastradas...`)

        await prisma.carro.createMany({ data: carros })
        console.log(`${carros.length} Carros Cadastrados...`)
    } catch (error) {
        console.error("Erro nas Inclusões (Seeds):", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

await main()
