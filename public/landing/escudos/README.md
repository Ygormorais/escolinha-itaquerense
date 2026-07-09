# Escudos manuais de adversários

Coloque aqui as imagens dos times que **não** têm logo estável na internet
(a FPFS hoje aponta para arquivos 404).

## Como cadastrar

1. Salve o PNG/JPG/WebP neste pasta, ex.: `magnus.png`
2. Edite `lib/landing/escudos-manuais.json`:

```json
{
  "contains": "MAGNUS",
  "src": "/landing/escudos/magnus.png"
}
```

3. Reinicie o dev server se necessário e atualize a landing.

## Regras de match

| Campo | Uso |
|--------|-----|
| `equals` | Nome completo do adversário (como no banco FPFS) |
| `contains` | Parte do nome (ex.: `"INDAIATUBA"`) |
| `pattern` | Regex JS, ex.: `"TABUCA\|TABOAO"` |
| `src` | `/landing/escudos/...` ou URL `https://...` |

A primeira entrada que casar vence. Prioridade: **manual > conhecidos > logodetimes > wiki > FPFS**.

## Dicas

- Prefira PNG transparente, ~128–256 px
- Nome do arquivo em minúsculas e sem espaços
- Para listar adversários sem logo: `npx tsx scripts/listar-adversarios-sem-escudo.ts`
