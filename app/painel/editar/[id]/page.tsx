import { notFound } from "next/navigation";
import { getAutomation } from "@/lib/automations";
import AutomationForm from "../../_components/AutomationForm";

export default async function EditarAutomacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const automation = await getAutomation(id);
  if (!automation) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Editar automação</h1>
      <AutomationForm automation={automation} />
    </div>
  );
}
