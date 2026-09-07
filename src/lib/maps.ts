type ResultadoGeocodificacao = {
  enderecoFormatado: string
  latitude: number
  longitude: number
}

export const calcularDistanciaKm = (
  latitudeOrigem: number,
  longitudeOrigem: number,
  latitudeDestino: number,
  longitudeDestino: number,
) => {
  const raioTerraKm = 6371
  const paraRadianos = (valor: number) => (valor * Math.PI) / 180
  const diferencaLatitude = paraRadianos(latitudeDestino - latitudeOrigem)
  const diferencaLongitude = paraRadianos(longitudeDestino - longitudeOrigem)
  const calculo =
    Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(paraRadianos(latitudeOrigem)) *
      Math.cos(paraRadianos(latitudeDestino)) *
      Math.sin(diferencaLongitude / 2) ** 2

  return raioTerraKm * 2 * Math.atan2(Math.sqrt(calculo), Math.sqrt(1 - calculo))
}

export const geocodificarEndereco = async (endereco: string): Promise<ResultadoGeocodificacao> => {
  const chaveApi = process.env.GOOGLE_MAPS_API_KEY
  if (!chaveApi) throw new Error('GOOGLE_MAPS_API_KEY não configurada.')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', endereco)
  url.searchParams.set('key', chaveApi)

  const resposta = await fetch(url)
  if (!resposta.ok) throw new Error('Não foi possível consultar a API do Google Maps.')

  const dados = (await resposta.json()) as {
    status?: string
    results?: Array<{
      formatted_address?: string
      geometry?: { location?: { lat?: number; lng?: number } }
    }>
  }
  const resultado = dados.results?.[0]
  const localizacao = resultado?.geometry?.location

  if (dados.status !== 'OK' || !resultado?.formatted_address || !localizacao) {
    throw new Error('Endereço não encontrado.')
  }

  return {
    enderecoFormatado: resultado.formatted_address,
    latitude: localizacao.lat ?? 0,
    longitude: localizacao.lng ?? 0,
  }
}
