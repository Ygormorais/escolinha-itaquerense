# Push Notifications PWA — Spec

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo
Responsáveis recebem notificações push no celular para os eventos que escolherem nas preferências do portal.

## Eventos suportados
| Evento | Trigger |
|---|---|
| Vencimento próximo | Cron diário (3 dias antes) |
| Pagamento confirmado | Webhook MP / registrarPagamento |
| Aluno faltou | Ao salvar frequência com "Ausente" |
| Convocação para jogo | Ao criar/editar Partida com data futura |
| Comunicado novo | Ao enviar comunicado |

## Modelos novos

```prisma
model PushSubscription {
  id            Int         @id @default(autoincrement())
  responsavelId Int
  responsavel   Responsavel @relation(...)
  endpoint      String      @unique
  p256dh        String
  auth          String
  createdAt     DateTime    @default(now())
}

model NotificacaoPreferencia {
  responsavelId       Int     @id
  responsavel         Responsavel @relation(...)
  vencimento          Boolean @default(true)
  pagamentoConfirmado Boolean @default(true)
  falta               Boolean @default(false)
  convocacao          Boolean @default(true)
  comunicado          Boolean @default(true)
}
```

## Componentes

### Service Worker (`public/sw.js`)
Adiciona handler `push`:
```js
self.addEventListener('push', (e) => {
  const { title, body, icon, url } = e.data.json()
  e.waitUntil(self.registration.showNotification(title, { body, icon, data: { url } }))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data.url))
})
```

### `POST /api/push/subscribe`
Salva/atualiza `PushSubscription` para o responsável autenticado.

### `lib/push.ts`
```ts
sendPush(responsavelId, { title, body, url })
```
- Busca subscriptions do responsável
- Filtra pela preferência correspondente ao tipo de evento
- Usa `web-push` npm para enviar (VAPID keys via env)

### Portal `/responsavel` — nova seção "Notificações"
- Toggle para cada tipo de evento
- Botão "Ativar notificações" → solicita permissão do browser → POST /api/push/subscribe

## Env vars necessárias
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:escola@exemplo.com
```

## Pacote necessário
`web-push` — envia notificações para endpoints registrados.
