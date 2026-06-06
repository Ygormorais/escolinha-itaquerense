# QR Code de Presença — Spec

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo
Registrar presença de alunos escaneando o QR code da carteirinha com o tablet da secretaria/técnico, sem digitar nada.

## Fluxo
1. Secretaria/técnico abre `/frequencia/scanner` no tablet
2. Câmera ativa automaticamente, exibe viewfinder
3. Aponta para a carteirinha do aluno → QR detectado
4. Server action valida HMAC e registra presença para a data atual
5. Feedback visual: nome do aluno + status (✓ Presente / já registrado / não encontrado) + beep sonoro

## Componentes

### QR Code na Carteirinha
- URL: `https://{APP_URL}/qr/{alunoId}?h={hmac}`
- HMAC-SHA256 com `SESSION_SECRET` sobre `alunoId` — impede fabricação
- Renderizado como SVG inline com lib `qrcode.react`

### Página Scanner `/frequencia/scanner`
- Client component — usa `html5-qrcode` para acesso à câmera
- Autenticada (admin/secretaria/tecnico)
- Parâmetro `?data=YYYY-MM-DD` (default: hoje)
- Após scan: chama server action, exibe card com resultado por 2s, retoma scan

### Server Action `registrarPresencaQr(token, data?)`
- Valida HMAC: `hmac(alunoId, SECRET) === h`
- Busca aluno por id
- Upsert em `Frequencia` com `presenca: "Presente"`
- Retorna `{ ok, alunoNome, jaRegistrado }`
- Revalida `/frequencia`

### Rota pública de validação `/qr/[id]`
- Redireciona para a carteirinha se aberta no celular (fallback útil)

## Modelo de dados
Sem alteração — usa `Frequencia` existente.

## Novos pacotes
- `qrcode.react` — gerar QR SVG
- `html5-qrcode` — câmera no browser

## Segurança
- HMAC impede QR falso
- Página scanner exige auth → não há risco de presença anônima
- Rate limit: max 1 scan por aluno por janela de 5s (evita duplo scan)
