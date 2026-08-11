# Piloto sem mensalidade na Oracle Cloud

O caminho de custo recorrente **R$ 0** que preserva a arquitetura atual é uma
VM **OCI Ampere A1 Always Free**. Ela roda Node 22, PM2, Caddy, SQLite e uploads
no próprio disco, sem migrar o banco nem reescrever o aplicativo.

Este é um ambiente de piloto: não há SLA, pode faltar capacidade para criar a
VM e a Oracle pode recolher instâncias consideradas ociosas. Mantenha backups e
não use esta configuração como única cópia de dados reais.

## Limites que devem aparecer como Always Free

- Uma VM `VM.Standard.A1.Flex` com até **2 OCPUs e 12 GB de RAM** no total.
- Ubuntu 24.04 marcado como elegível ao Always Free.
- Boot volume de 50 GB (dentro dos 200 GB de block/boot volume gratuitos).
- Um IPv4 público atribuído à VM.
- Nenhum load balancer, banco gerenciado ou recurso sem o selo Always Free.

Os limites atuais e a política de recolhimento estão na
[documentação oficial da Oracle](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).

## 1. Criar a conta

Use o [cadastro oficial do OCI Free Tier](https://signup.oraclecloud.com/).
A Oracle pede telefone, CPF/endereço no Brasil e cartão de crédito ou débito
compatível para verificar a identidade. Pode existir uma retenção temporária,
mas a Oracle informa que o cartão não é cobrado sem uma escolha explícita de
upgrade.

Escolha a **home region** com cuidado: ela não pode ser alterada depois. Para
dados que devam permanecer no Brasil, use uma região brasileira; a capacidade
gratuita A1 pode variar e não é garantida.

## 2. Criar a VM gratuita

Na Console OCI:

1. Abra **Compute → Instances → Create instance**.
2. Nome: `escolinha`.
3. Image: **Ubuntu 24.04**, com indicação Always Free.
4. Shape: **VM.Standard.A1.Flex**, 2 OCPUs e 12 GB de RAM.
5. Crie/selecione uma VCN e subnet pública e marque **Assign a public IPv4**.
6. Gere ou envie uma chave SSH e guarde a chave privada com segurança.
7. Mantenha o boot volume em 50 GB.
8. Antes de confirmar, verifique o selo **Always Free eligible** e custo estimado
   zero. Não clique em **Upgrade**.

Se aparecer `Out of host capacity`, tente outro availability domain da mesma
home region ou aguarde. Não troque para uma shape paga.

## 3. Liberar somente as portas necessárias

Na Security List ou Network Security Group da VCN, permita entrada:

- TCP 22: preferencialmente apenas do seu IP público.
- TCP 80 e 443: `0.0.0.0/0` para acesso ao site e emissão do certificado TLS.

O `deploy/setup-vps.sh` também configura o firewall dentro do Ubuntu.

## 4. Obter HTTPS sem comprar domínio

Para o piloto, use [sslip.io](https://sslip.io/), que resolve um hostname contendo
o próprio IPv4. Se a VM receber `203.0.113.10`, o endereço será:

```text
https://203-0-113-10.sslip.io
```

O Caddy emitirá um certificado TLS normal para esse hostname. Se o IPv4 público
mudar, será necessário atualizar o hostname, o `.env`, o Caddy e as variáveis do
GitHub.

## 5. Instalar o aplicativo

No seu computador, proteja a chave SSH e conecte-se:

```bash
chmod 600 SUA_CHAVE.key
ssh -i SUA_CHAVE.key ubuntu@IP_PUBLICO
```

Na VM:

```bash
git clone https://github.com/Ygormorais/escolinha-itaquerense.git
cd escolinha-itaquerense
bash deploy/setup-vps.sh
bash deploy/gen-secrets.sh
nano .env
```

O primeiro `setup-vps.sh` instala os componentes e para para que o `.env` seja
preenchido. Use, no mínimo:

```env
NODE_ENV=production
DATABASE_URL=file:/var/lib/escolinha/prod.db
UPLOADS_DIR=/var/lib/escolinha/uploads
BACKUP_DIR=/var/lib/escolinha/backups
CLUB_CONFIG_PATH=/var/lib/escolinha/config/club.config.json
NEXT_PUBLIC_APP_URL=https://203-0-113-10.sslip.io
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<senha forte com pelo menos 12 caracteres>
SESSION_SECRET=<hex aleatório com pelo menos 32 caracteres>
CRON_SECRET=<hex aleatório>
FPFS_SYNC_TOKEN=<hex aleatório>
REQUIRE_OPTIONAL_INTEGRATIONS=false
TZ=UTC
```

Substitua o IP de exemplo pelo IP real. Não publique o `.env` nem envie esses
segredos por mensagem.

Finalize a instalação e crie o admin:

```bash
bash deploy/setup-vps.sh
npm run db:seed-prod
```

Depois, configure o hostname somente no arquivo local do sistema. Não edite
`deploy/Caddyfile`, pois ele pertence ao Git e um checkout sujo bloqueia o
rollback seguro:

```bash
sudo nano /etc/caddy/Caddyfile
```

Substitua o conteúdo por:

```caddyfile
203-0-113-10.sslip.io {
	encode zstd gzip
	header -Server
	reverse_proxy localhost:3000
}
```

Valide, recarregue e teste:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -fsS https://203-0-113-10.sslip.io/api/health
```

As atualizações normais usam `deploy/deploy.sh` e preservam esse arquivo local.
Se você executar `setup-vps.sh` novamente, reaplique o bloco acima, pois o setup
reinstala a configuração padrão do Caddy.

O health check deve retornar `status: ok` e `db: ok`. Depois, abra a URL e faça
login com `ADMIN_USERNAME` e `ADMIN_PASSWORD`.

## 6. Conectar o GitHub depois que a URL funcionar

No Environment `production` do GitHub:

- Variable `APP_URL`: a URL HTTPS da VM.
- Secret `CRON_SECRET`: exatamente o mesmo valor do `.env`.

Execute o workflow de lembretes manualmente. Só depois de validá-lo altere a
repository variable `LEMBRETES_CRON_ENABLED` para `true`.

O workflow atual de backup remoto exige credenciais SSH e armazenamento externo;
mantenha `BACKUP_ENABLED=false` até configurá-los. Os snapshots locais ajudam em
rollback, mas não substituem uma cópia fora da VM.

## Riscos do Always Free

- A criação da A1 pode falhar por falta de capacidade regional.
- Instâncias com CPU, rede e memória abaixo dos critérios da Oracle por sete dias
  podem ser recolhidas.
- Conta sem atividade por período prolongado pode ser suspensa.
- Não há SLA nem suporte técnico no plano gratuito.

Por isso, esta opção serve para colocar o sistema no ar sem mensalidade agora.
Antes de uso diário com dados reais de alunos e responsáveis, configure backup
externo e defina um plano de recuperação.
