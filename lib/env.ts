import "server-only";

/**
 * Acesso central às variáveis de ambiente.
 *
 * Tudo aqui é de SERVIDOR. O import "server-only" garante que, se algum
 * componente do navegador tentar importar este arquivo por engano, o build
 * quebra na hora — assim a service key nunca vaza pro cliente.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Preencha no .env.local (dev) ou na Vercel (produção).`,
    );
  }
  return value;
}

export const env = {
  // Endereço público do app, sempre sem barra no final.
  get appUrl(): string {
    return required("APP_URL").replace(/\/$/, "");
  },
  get supabaseUrl(): string {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey(): string {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get instagramAppId(): string {
    return required("INSTAGRAM_APP_ID");
  },
  get instagramAppSecret(): string {
    return required("INSTAGRAM_APP_SECRET");
  },
  get webhookVerifyToken(): string {
    return required("WEBHOOK_VERIFY_TOKEN");
  },
  get cronSecret(): string {
    return required("CRON_SECRET");
  },
  // Opcional: e-mail de contato exibido nas páginas públicas de privacidade.
  get contactEmail(): string {
    return process.env.CONTACT_EMAIL || "contato@exemplo.com";
  },
  // Opcional: nome do app (para quem faz self-host e quer renomear).
  get appName(): string {
    return process.env.APP_NAME || "InstaChat";
  },
};
