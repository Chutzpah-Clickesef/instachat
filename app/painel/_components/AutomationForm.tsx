import Link from "next/link";
import type { Automation } from "@/lib/types";
import { saveAutomationAction, deleteAutomationAction } from "../actions";
import PostSelector from "./PostSelector";

const input =
  "w-full rounded-lg border border-[#dbdbdb] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-ig-blue focus:ring-2 focus:ring-ig-blue/20";
const label = "block text-sm font-semibold";
const hint = "text-xs text-neutral-500";

function Field({
  title,
  children,
  description,
}: {
  title: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className={label}>{title}</label>
      {description ? <p className={hint}>{description}</p> : null}
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
        <span className="bg-ig-blue h-3 w-1 rounded-full" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AutomationForm({
  automation,
}: {
  automation?: Automation | null;
}) {
  const a = automation ?? null;
  const reminderMinutes = a ? Math.round(a.reminder_delay_seconds / 60) : "";

  return (
    <form action={saveAutomationAction} className="space-y-5">
      {a ? <input type="hidden" name="id" value={a.id} /> : null}

      <Section title="Básico">
        <Field title="Nome da automação">
          <input
            name="name"
            defaultValue={a?.name ?? ""}
            placeholder="Ex: Link do ebook"
            className={input}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={a?.active ?? true}
          />
          Ativa
        </label>
      </Section>

      <Section title="Gatilhos">
        <p className={hint}>Onde essa automação deve reagir.</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="trigger_comment"
              defaultChecked={a?.trigger_comment ?? true}
            />
            Comentário em post/reels
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="trigger_story"
              defaultChecked={a?.trigger_story ?? false}
            />
            Resposta a story
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="trigger_dm"
              defaultChecked={a?.trigger_dm ?? false}
            />
            DM direta
          </label>
        </div>
      </Section>

      <Section title="Palavra-chave">
        <Field
          title="Palavras-chave"
          description="Uma por linha (ou separadas por vírgula). Não diferencia acento/maiúscula."
        >
          <textarea
            name="keywords"
            rows={3}
            defaultValue={a?.keywords.join("\n") ?? ""}
            placeholder={"quero\nlink\neu quero"}
            className={input}
          />
        </Field>
        <Field
          title="Tipo de correspondência"
          description="Contém: a palavra aparece no texto. Exato: o texto é igual à palavra. Qualquer: reage a qualquer texto."
        >
          <select
            name="match_type"
            defaultValue={a?.match_type ?? "contains"}
            className={input}
          >
            <option value="contains">Contém</option>
            <option value="exact">Exato</option>
            <option value="any">Qualquer</option>
          </select>
        </Field>
        <Field
          title="Post específico (opcional)"
          description="Só para o gatilho de comentário. Deixe em “qualquer post” para valer em todos."
        >
          <PostSelector defaultValue={a?.media_id ?? null} />
        </Field>
      </Section>

      <Section title="Resposta pública no comentário (opcional)">
        <Field
          title="Variações"
          description="Uma por linha. O sistema sorteia uma para responder publicamente no comentário."
        >
          <textarea
            name="public_replies"
            rows={3}
            defaultValue={a?.public_replies.join("\n") ?? ""}
            placeholder={"Te mandei no direct! 💌\nOlha lá na sua DM 😉"}
            className={input}
          />
        </Field>
      </Section>

      <Section title="DM de boas-vindas">
        <Field
          title="Mensagem"
          description="Enviada na DM assim que a palavra-chave casa."
        >
          <textarea
            name="welcome_message"
            rows={3}
            defaultValue={a?.welcome_message ?? ""}
            placeholder="Oi! Que bom que você veio 💜 Toca no botão que eu te mando o link."
            className={input}
          />
        </Field>
        <Field
          title="Botão de resposta rápida (opcional)"
          description="O toque nesse botão abre a janela de 24h e libera o envio do link."
        >
          <input
            name="quick_reply_label"
            maxLength={20}
            defaultValue={a?.quick_reply_label ?? ""}
            placeholder="QUERO O LINK"
            className={input}
          />
        </Field>
      </Section>

      <Section title="DM com o link">
        <Field title="Mensagem do link">
          <textarea
            name="link_message"
            rows={2}
            defaultValue={a?.link_message ?? ""}
            placeholder="Aqui está, aproveite! 👇"
            className={input}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field title="Rótulo do botão">
            <input
              name="link_button_label"
              maxLength={20}
              defaultValue={a?.link_button_label ?? ""}
              placeholder="Abrir link"
              className={input}
            />
          </Field>
          <Field title="URL do link">
            <input
              name="link_url"
              type="url"
              defaultValue={a?.link_url ?? ""}
              placeholder="https://..."
              className={input}
            />
          </Field>
        </div>
      </Section>

      <Section title="Lembrete (opcional)">
        <p className={hint}>
          Como não dá para saber se a pessoa clicou, o lembrete dispara por
          tempo depois que ela toca no botão.
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field title="Mensagem do lembrete">
            <textarea
              name="reminder_message"
              rows={2}
              defaultValue={a?.reminder_message ?? ""}
              placeholder="Ei, não esquece de dar uma olhada no link 😉"
              className={input}
            />
          </Field>
          <Field title="Atraso (min)">
            <input
              name="reminder_delay_minutes"
              type="number"
              min={0}
              defaultValue={reminderMinutes}
              placeholder="60"
              className={`${input} w-24`}
            />
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-ig rounded-lg px-5 py-2 text-sm font-semibold"
          >
            Salvar
          </button>
          <Link
            href="/painel"
            className="btn-neutral rounded-lg px-5 py-2 text-sm font-semibold"
          >
            Cancelar
          </Link>
        </div>
        {a ? (
          <button
            type="submit"
            formAction={deleteAutomationAction}
            formNoValidate
            className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Excluir
          </button>
        ) : null}
      </div>
    </form>
  );
}
