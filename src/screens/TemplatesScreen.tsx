import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useExercises } from '@/hooks/useExercises';
import { useTemplates } from '@/hooks/useTemplates';
import { templateRepo } from '@/db/repositories/templateRepo';
import type { TemplateExercise } from '@/db/schema';
import { t } from '@/i18n';

export function TemplatesScreen() {
  const templates = useTemplates();
  const exercises = useExercises();
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title={t('templates.title')}
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={16} />
            {t('templates.new')}
          </button>
        }
      />
      <div className="px-4 py-4 md:px-8">
        {templates.length === 0 && (
          <div className="rounded-xl border border-dashed border-[rgb(var(--border))] p-8 text-center text-sm text-[rgb(var(--text-muted))]">
            {t('common.empty')}
          </div>
        )}
        <ul className="space-y-3">
          {templates.map((tpl) => (
            <li key={tpl.id} className="card p-4">
              <header className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{tpl.name}</h2>
                <button
                  onClick={() => {
                    if (confirm('Vymazať šablónu?')) void templateRepo.remove(tpl.id);
                  }}
                  className="btn-ghost p-1"
                >
                  <Trash2 size={14} />
                </button>
              </header>
              <ul className="text-sm text-[rgb(var(--text-muted))]">
                {tpl.exercises.map((te, i) => {
                  const ex = exercises.find((e) => e.id === te.exerciseId);
                  return (
                    <li key={i} className="flex justify-between">
                      <span>{ex?.name ?? '?'}</span>
                      <span>
                        {te.targetSets}× {te.targetRepsMin}–{te.targetRepsMax}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      {creating && (
        <CreateTemplateModal
          onClose={() => setCreating(false)}
          onCreate={async (data) => {
            await templateRepo.create(data);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTemplateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; exercises: TemplateExercise[] }) => Promise<void>;
}) {
  const exercises = useExercises();
  const [name, setName] = useState('');
  const [items, setItems] = useState<TemplateExercise[]>([]);

  const add = () => {
    if (!exercises[0]) return;
    setItems((p) => [
      ...p,
      { exerciseId: exercises[0]!.id, targetSets: 3, targetRepsMin: 6, targetRepsMax: 10 },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="card w-full max-w-md p-4 sm:rounded-xl">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('templates.new')}</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            void onCreate({ name: name.trim(), exercises: items });
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">{t('templates.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" autoFocus />
          </div>
          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li key={idx} className="grid grid-cols-12 items-center gap-2">
                <select
                  value={it.exerciseId}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) => (i === idx ? { ...x, exerciseId: e.target.value } : x)),
                    )
                  }
                  className="input col-span-6"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={it.targetSets}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) =>
                        i === idx ? { ...x, targetSets: parseInt(e.target.value, 10) || 1 } : x,
                      ),
                    )
                  }
                  className="input col-span-2"
                  aria-label={t('templates.targetSets')}
                />
                <input
                  type="number"
                  min={1}
                  value={it.targetRepsMin}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) =>
                        i === idx ? { ...x, targetRepsMin: parseInt(e.target.value, 10) || 1 } : x,
                      ),
                    )
                  }
                  className="input col-span-2"
                  aria-label="reps min"
                />
                <input
                  type="number"
                  min={1}
                  value={it.targetRepsMax}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, i) =>
                        i === idx ? { ...x, targetRepsMax: parseInt(e.target.value, 10) || 1 } : x,
                      ),
                    )
                  }
                  className="input col-span-2"
                  aria-label="reps max"
                />
              </li>
            ))}
          </ul>
          <button type="button" onClick={add} className="btn-secondary">
            <Plus size={14} /> {t('templates.addExercise')}
          </button>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">
              {t('common.save')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
