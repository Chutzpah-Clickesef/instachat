import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — InstaChat",
};

export default function PrivacidadePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-neutral-800 dark:text-neutral-200">
      <h1 className="text-2xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Última atualização: 20 de julho de 2026
      </p>

      <p className="mt-6">
        O InstaChat é uma ferramenta pessoal usada pelo titular da conta do
        Instagram conectada para responder automaticamente a comentários,
        respostas de stories e mensagens diretas por meio da API oficial do
        Instagram. Esta política explica quais dados são tratados e como.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Dados que tratamos</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Identificador e nome de usuário do Instagram de quem interage
          (comenta, responde um story ou envia uma mensagem).
        </li>
        <li>
          Conteúdo da interação necessário para acionar a automação (texto do
          comentário ou da mensagem) e horários dos eventos.
        </li>
        <li>
          Dados da conta conectada (identificador, nome de usuário, foto de
          perfil) e o token de acesso fornecido pela Meta.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Como usamos</h2>
      <p className="mt-2">
        Os dados são usados exclusivamente para enviar as respostas automáticas
        configuradas pelo titular da conta e para respeitar os limites da
        plataforma (por exemplo, a janela de 24 horas para mensagens). Não
        vendemos dados nem os usamos para publicidade.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Onde ficam armazenados</h2>
      <p className="mt-2">
        Os dados ficam em um banco de dados privado (Supabase) e a aplicação é
        hospedada na Vercel. O acesso ao banco é restrito ao servidor da
        aplicação. Compartilhamos dados apenas com a Meta/Instagram, na medida
        necessária para enviar as mensagens.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Retenção e seus direitos</h2>
      <p className="mt-2">
        Mantemos os dados apenas enquanto forem necessários para o funcionamento
        das automações. Você pode solicitar acesso ou exclusão dos seus dados a
        qualquer momento — veja a página de{" "}
        <a href="/exclusao-de-dados" className="text-pink-600 underline">
          Exclusão de Dados
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">Contato</h2>
      <p className="mt-2">
        Dúvidas sobre privacidade:{" "}
        <a
          href="mailto:victorhanielbusiness@gmail.com"
          className="text-pink-600 underline"
        >
          victorhanielbusiness@gmail.com
        </a>
        .
      </p>
    </article>
  );
}
