import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Schema com os campos consultados
const schemaVeiculo = {
  type: 'OBJECT',
  properties: {
    pontosFortes: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Principais pontos fortes do veículo (3 a 5 itens)',
    },
    pontosFracos: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Principais pontos fracos do veículo (3 a 5 itens)',
    },
    consumoMedioCidade: {
      type: 'NUMBER',
      description: 'Consumo médio na cidade, em km/l',
    },
    consumoMedioEstrada: {
      type: 'NUMBER',
      description: 'Consumo médio na estrada, em km/l',
    },
  },
  required: ['pontosFortes', 'pontosFracos', 'consumoMedioCidade', 'consumoMedioEstrada'],
};

export async function buscarDadosComGemini(marca: string, modelo: string, ano: number) {
  const resposta = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `Veículo: ${marca} ${modelo} (${ano}), versão comercializada no Brasil.
      Liste os principais pontos fortes, os principais pontos fracos e o
      consumo médio de combustível na cidade e na estrada, em km/l.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schemaVeiculo,
    },
  })

  return JSON.parse(resposta.text || '{}')
}
