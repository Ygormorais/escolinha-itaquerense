function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

export function gerarPixPayload({
  chave,
  nome,
  cidade,
  valor,
  descricao = "Mensalidade",
}: {
  chave: string
  nome: string
  cidade: string
  valor?: number
  descricao?: string
}): string {
  const nomeTrunc = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").substring(0, 25)
  const cidadeTrunc = cidade.normalize("NFD").replace(/[̀-ͯ]/g, "").substring(0, 15)
  const txid = descricao.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "").substring(0, 25) || "***"

  const mai = field("00", "BR.GOV.BCB.PIX") + field("01", chave)
  const adft = field("05", txid)

  let payload = field("00", "01")
  payload += field("26", mai)
  payload += field("52", "0000")
  payload += field("53", "986")
  if (valor && valor > 0) payload += field("54", valor.toFixed(2))
  payload += field("58", "BR")
  payload += field("59", nomeTrunc)
  payload += field("60", cidadeTrunc)
  payload += field("62", adft)
  payload += "6304"

  return payload + crc16(payload)
}
