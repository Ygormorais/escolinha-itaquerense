import { describe, expect, it } from "vitest"
import { mensagemPermissaoCamera } from "@/lib/camera-guidance"

describe("mensagemPermissaoCamera", () => {
  it("orienta as configurações de privacidade no Windows", () => {
    const mensagem = mensagemPermissaoCamera("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    expect(mensagem).toContain("Windows")
    expect(mensagem).toContain("Privacidade e segurança › Câmera")
    expect(mensagem).toContain("aplicativos da área de trabalho")
  })

  it("orienta as permissões do site no Android sem citar Windows", () => {
    const mensagem = mensagemPermissaoCamera("Mozilla/5.0 (Linux; Android 15) Chrome/140 Mobile")
    expect(mensagem).toContain("Permissões › Câmera")
    expect(mensagem).not.toContain("Windows")
  })

  it("orienta os Ajustes no iPhone e iPad", () => {
    const mensagem = mensagemPermissaoCamera("Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X)")
    expect(mensagem).toContain("Ajustes › Privacidade e Segurança › Câmera")
  })
})
