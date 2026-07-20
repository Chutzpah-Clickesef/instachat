import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Exclusão de Dados — InstaChat",
};

export default function ExclusaoDeDadosPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-neutral-800 dark:text-neutral-200">
      <h1 className="text-2xl font-bold">Exclusão de Dados</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Última atualização: 20 de julho de 2026
      </p>

      <p className="mt-6">
        Você pode pedir a exclusão de todos os dados associados ao seu perfil do
        Instagram tratados pelo InstaChat.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Como solicitar</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Envie um e-mail para{" "}
          <a href={`mailto:${env.contactEmail}`} className="text-pink-600 underline">
            {env.contactEmail}
          </a>{" "}
          com o assunto <b>“Exclusão de dados”</b>.
        </li>
        <li>Informe o seu nome de usuário do Instagram (@).</li>
      </ol>

      <p className="mt-4">
        A exclusão dos dados relacionados ao seu perfil (identificador, nome de
        usuário, registros de interação e itens em fila) é feita em até 30 dias
        a partir da solicitação. Você recebe uma confirmação por e-mail quando a
        exclusão é concluída.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Revogar o acesso</h2>
      <p className="mt-2">
        Você também pode remover o aplicativo a qualquer momento em{" "}
        <b>Instagram → Configurações → Apps e sites</b>, o que interrompe
        imediatamente qualquer tratamento futuro de dados.
      </p>
    </article>
  );
}
