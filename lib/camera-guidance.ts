export function mensagemPermissaoCamera(userAgent: string) {
  if (/Windows/i.test(userAgent)) {
    return "Permissão de câmera negada. Libere a câmera nas permissões deste site e, no Windows, abra Configurações › Privacidade e segurança › Câmera e ative o acesso para aplicativos da área de trabalho."
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "Permissão de câmera negada. No iPhone ou iPad, abra Ajustes › Privacidade e Segurança › Câmera, permita o acesso para este navegador e tente novamente."
  }
  if (/Android/i.test(userAgent)) {
    return "Permissão de câmera negada. Toque no cadeado ao lado do endereço e altere Permissões › Câmera para Permitir."
  }
  return "Permissão de câmera negada. Abra as permissões deste site no navegador, permita o uso da câmera e tente novamente."
}
