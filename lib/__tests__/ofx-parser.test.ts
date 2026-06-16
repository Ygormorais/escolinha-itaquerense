import { describe, it, expect } from "vitest"
import { parseOFX } from "../ofx-parser"

const OFX_SAMPLE = `
<OFX>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20250601120000</DTPOSTED>
<TRNAMT>150.00</TRNAMT>
<FITID>111</FITID>
<MEMO>PIX RECEBIDO - JOAO SILVA</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20250605</DTPOSTED>
<TRNAMT>200.50</TRNAMT>
<FITID>222</FITID>
<MEMO>PIX RECEBIDO - MARIA SANTOS</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20250606120000</DTPOSTED>
<TRNAMT>-50.00</TRNAMT>
<FITID>333</FITID>
<MEMO>TARIFA BANCARIA</MEMO>
</STMTTRN>
</OFX>
`

describe("parseOFX", () => {
  it("parseia OFX SGML com 3 transações, retorna só créditos", () => {
    const result = parseOFX(OFX_SAMPLE)
    expect(result).toHaveLength(2)
    expect(result[0].fitid).toBe("111")
    expect(result[0].amount).toBe(150)
    expect(result[0].memo).toBe("PIX RECEBIDO - JOAO SILVA")
    expect(result[1].fitid).toBe("222")
    expect(result[1].amount).toBe(200.5)
  })

  it("lança erro em arquivo sem blocos STMTTRN", () => {
    expect(() => parseOFX("<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>")).toThrow(
      "Nenhuma transação encontrada no arquivo OFX"
    )
  })

  it("lança erro quando todos os blocos são débitos", () => {
    const onlyDebits = `
<OFX>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20250601120000</DTPOSTED>
<TRNAMT>-100.00</TRNAMT>
<FITID>999</FITID>
<MEMO>DEBITO</MEMO>
</STMTTRN>
</OFX>`
    expect(() => parseOFX(onlyDebits)).toThrow(
      "Nenhuma transação encontrada no arquivo OFX"
    )
  })

  it("parseia data no formato YYYYMMDDHHMMSS", () => {
    const result = parseOFX(OFX_SAMPLE)
    expect(result[0].date).toEqual(new Date(2025, 5, 1))
  })

  it("parseia data no formato YYYYMMDD (sem hora)", () => {
    const result = parseOFX(OFX_SAMPLE)
    expect(result[1].date).toEqual(new Date(2025, 5, 5))
  })
})
