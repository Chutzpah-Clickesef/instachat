# InstaChat

[![English](https://img.shields.io/badge/English-eaeaea?style=for-the-badge)](README.md)
[![Português](https://img.shields.io/badge/Portugu%C3%AAs-1f9d55?style=for-the-badge)](README.pt-BR.md)
[![+ Adicionar idioma](https://img.shields.io/badge/+_Adicionar_idioma-eaeaea?style=for-the-badge)](#-tradu%C3%A7%C3%B5es)

Uma alternativa ao ManyChat **sem mensalidade** e com o código na sua mão, para
automatizar DMs do Instagram. Quando alguém **comenta uma palavra-chave** num
post/reels ou **responde ao seu story**, a pessoa recebe automaticamente uma
**DM com o seu link**.

Feito para rodar 100% em **planos grátis** (Supabase + Vercel + um app da Meta
em modo de desenvolvimento). Você hospeda a sua própria cópia e conecta o seu
próprio Instagram.

> **Licença:** MIT — livre para usar, copiar, modificar e distribuir.

---

## Recursos

- Comentário com palavra-chave → **resposta privada** (fura a janela de 24h).
- **Resposta pública** opcional no comentário (sorteia entre variações).
- Gatilhos de **resposta a story** e **DM direta**.
- Botão de resposta rápida que abre a janela de 24h e libera os **follow-ups**
  (DM com o link + um **lembrete por tempo**).
- **Seletor visual de posts** (limitar uma automação a um post específico).
- **Fila** de envio com trava atômica (`FOR UPDATE SKIP LOCKED`) — nunca envia
  em dobro — com limites (~2/seg, ~200 DMs/hora).
- **Painel** de administração protegido por senha para criar e gerenciar
  automações.

## Como funciona

Um webhook recebe os eventos `comments`/`messages` e valida a assinatura
`X-Hub-Signature-256` (HMAC do corpo cru). Os casamentos vão para a fila; um
worker drena a fila e envia pela **API do Instagram com Login do Instagram**
(`graph.instagram.com`, v25.0 — **não precisa de página do Facebook**).

Como o plano grátis da Vercel não roda cron de minuto, o **`pg_cron` + `pg_net`
do Supabase** batem no endpoint de drenagem a cada minuto e renovam o token de
60 dias uma vez por semana. O webhook também dispara a drenagem pelo `after()`
do Next.js, para o envio parecer instantâneo.

## Tecnologias

- **Next.js 16** (App Router, TypeScript) + Tailwind, publicado na **Vercel**
- **Supabase** (Postgres) — acesso só no servidor com a service-role key; RLS
  ligado sem políticas
- **Node.js 22+**

---

## Instalação (self-host)

### 0. Pré-requisitos

- Node.js **22+** e Git
- Uma conta **profissional** do Instagram (Comercial ou Criador)
- Contas grátis: **Supabase**, **Vercel**, **Meta for Developers** (precisa de
  uma conta do Facebook para entrar no portal de desenvolvedores)

### 1. Clonar e instalar

```bash
git clone https://github.com/Chutzpah-Clickesef/instachat.git
cd instachat
npm install
cp .env.example .env.local   # preencha os valores conforme avançar
```

### 2. Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com). Você pode desligar
   "Automatically expose new tables" — o schema concede acesso à `service_role`
   explicitamente.
2. Abra o **SQL Editor** e rode o [`supabase/schema.sql`](supabase/schema.sql).
3. Copie a **Project URL** e a **service_role key** (Settings → API) para o
   `.env.local` como `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Variáveis de ambiente

Veja a lista completa em [`.env.example`](.env.example). Gere os segredos:

```bash
# WEBHOOK_VERIFY_TOKEN
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# CRON_SECRET
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 4. Publicar na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FChutzpah-Clickesef%2Finstachat&env=SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,INSTAGRAM_APP_ID,INSTAGRAM_APP_SECRET,WEBHOOK_VERIFY_TOKEN,CRON_SECRET,APP_URL,PANEL_PASSWORD)

Após o primeiro deploy, defina `APP_URL` com a sua URL de produção
(ex.: `https://seu-app.vercel.app`, sem barra no final) e republique.

### 5. App na Meta (API do Instagram com Login do Instagram)

1. Em [developers.facebook.com](https://developers.facebook.com), crie um app
   (tipo **Empresa**) e adicione o produto **Instagram** →
   *Configuração da API com login do Instagram*.
2. Copie o **ID do app do Instagram** e a **Chave secreta** para a Vercel como
   `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET`; republique.
3. **URI de redirecionamento OAuth:** `https://SEU_APP/api/oauth/callback`
4. **Webhook:** URL de callback `https://SEU_APP/api/webhook`, verify token =
   seu `WEBHOOK_VERIFY_TOKEN`, e assine os campos `comments` e `messages`.
5. Adicione seu usuário do Instagram como **testador** (Funções do app) e aceite
   o convite no app do Instagram (Configurações → Apps e sites → Convites de
   testador).
6. Cadastre as URLs de privacidade em **Configurações → Básico**:
   `https://SEU_APP/privacidade` e `https://SEU_APP/exclusao-de-dados`, e então
   **publique o app (Ao vivo)** — em modo de desenvolvimento o webhook não
   entrega os eventos.

### 6. O "relógio" grátis (pg_cron)

Edite o [`supabase/cron.sql`](supabase/cron.sql), trocando `__APP_URL__` e
`__CRON_SECRET__`, e rode no SQL Editor do Supabase. Isso drena a fila a cada
minuto e renova o token semanalmente.

### 7. Conectar e testar

Abra `/painel`, clique em **Conectar Instagram**, autorize e crie uma automação.
Comente a palavra-chave de outra conta e veja a DM sair.

---

## Limites reais (regras da Meta)

- **Não dá** para exigir que a pessoa te siga antes de mandar o link — a API não
  verifica seguidores. Só dá para pedir na mensagem.
- **Não dá** para saber se a pessoa clicou no link — o lembrete dispara por
  tempo.
- **Disparo em massa para base fria é proibido** e derruba a conta. Só há
  respostas acionadas por comentário/story/DM, de propósito.

## Desenvolvimento

```bash
npm run dev        # http://localhost:3000
npm run build      # build de produção
npx tsc --noEmit   # checagem de tipos
```

## 🌍 Traduções

Ajude a traduzir este README para o seu idioma — é rápido:

1. Copie o `README.md` para `README.<código>.md`, onde `<código>` é a tag do
   idioma (ex.: `README.es.md` para espanhol, `README.fr.md` para francês — veja
   [BCP 47](https://pt.wikipedia.org/wiki/Etiqueta_de_idioma_IETF)).
2. Traduza o conteúdo.
3. Adicione um badge do seu idioma no **bloco de troca de idioma no topo de
   todos os READMEs** (mantenha a lista igual em todos os arquivos):

   ```md
   [![Español](https://img.shields.io/badge/Espa%C3%B1ol-eaeaea?style=for-the-badge)](README.es.md)
   ```
4. Abra um pull request. 🙌

Disponíveis agora: **English (README.md)**, **Português**.

## Licença

[MIT](LICENSE)
