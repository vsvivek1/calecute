import type { Metadata } from "next";
import { createTask } from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import TaskFields from "@/office/components/TaskFields";
import { listPeople } from "@/office/data";
import { todayIn } from "@/office/dates";
import { requireLead } from "@/office/session";

export const metadata: Metadata = { title: "Assign a task" };

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const officer = await requireLead();
  const { person } = await searchParams;
  const people = await listPeople({ activeOnly: true });
  const today = todayIn(officer.settings.timezone);

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="h1">Assign a task</h1>
        <p className="mt-1 muted">The person sees it on their own list straight away.</p>
      </div>
      <div className="card">
        <ActionForm action={createTask} submit="Assign task" pendingLabel="Assigning…" reset={false}>
          <TaskFields people={people} defaults={{ assignee_id: person, start_date: today }} />
        </ActionForm>
      </div>
    </div>
  );
}
