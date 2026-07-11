# Depoimentos de pais e alunos

A landing **não inventa** depoimentos. Citações atuais vêm de fonte pública
(Fato Paulista · série Elite 100 anos, 2022) e creditam a origem na UI.

## Por que pais/alunos ainda não aparecem

Para exibir nome + texto de família ou atleta menor de idade é preciso:

1. **Consentimento escrito** do responsável (e do aluno se 16+)
2. Texto revisado (sem dados sensíveis: endereço, telefone, RG, escola)
3. Autorização de uso em site / redes / materiais do clube

Sem isso, a seção “Voz do clube” permanece só com voz institucional pública.

## Como coletar (operacional)

1. WhatsApp ou conversa presencial → enviar o modelo abaixo
2. Guardar PDF/foto da autorização em pasta interna do clube (não no git)
3. Enviar ao time que edita o site o texto + nome preferido + categoria
4. Dev adiciona em `lib/landing/conteudo.ts` no array `depoimentos`

### Modelo de autorização (copiar)

```
Eu, _________________________________, responsável por ________________________
(categoria: ________), autorizo a Sociedade Esportiva Elite Itaquerense a
publicar o depoimento abaixo no site oficial e materiais do clube.

Depoimento:
“________________________________________________________________
________________________________________________________________”

Como quero ser identificado (ex.: “Maria S. · mãe do Sub-11”):
________________________________

Data: ____/____/________   Assinatura: ________________________
```

## Formato no código

```ts
{
  texto: "…",
  autor: "Nome curto · mãe/pai",
  categoria: "Sub-11", // opcional
  // sem fonteUrl se for depoimento próprio com consentimento
}
```

Máximo sugerido na home: **3 cards de pais/alunos** + voz institucional em
matérias, para não diluir a seção.
