import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTemplates } from '@/hooks/useTemplates';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { t } from '@/i18n';

export function NewWorkoutScreen() {
  const navigate = useNavigate();
  const templates = useTemplates();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<string>('');

  const handleStart = async () => {
    const tpl = templates.find((tt) => tt.id === templateId);
    const finalName = name.trim() || tpl?.name || '';
    const w = await workoutRepo.create({
      date,
      startedAt: new Date().toISOString(),
      name: finalName || undefined,
      templateId: tpl?.id,
    });
    navigate(`/workouts/${w.id}/active`);
  };

  return (
    <div>
      <PageHeader title={t('workouts.new')} />
      <div className="space-y-4 px-4 py-4 md:max-w-xl md:px-8">
        <div>
          <label className="label" htmlFor="wk-date">{t('workouts.date')}</label>
          <input
            id="wk-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="wk-name">{t('workouts.name')}</label>
          <input
            id="wk-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workouts.namePlaceholder')}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="wk-tpl">{t('workouts.template')}</label>
          <select
            id="wk-tpl"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="input"
          >
            <option value="">{t('workouts.noTemplate')}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleStart} className="btn-primary">
            {t('workouts.start')}
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
