import { useRef, useState } from 'react';
import { Download, Upload, Moon, Sun, Monitor, Sparkles, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSettings } from '@/hooks/useSettings';
import {
  applyImport,
  buildExport,
  downloadFile,
  exportToCsv,
  exportToJsonString,
  validateImport,
} from '@/domain/exportImport';
import { useUiStore } from '@/state/uiStore';
import { formulaLabel } from '@/domain/oneRm';
import { clearAllData, loadDemoData } from '@/db/demoData';
import type { OneRmFormula } from '@/db/schema';
import { t } from '@/i18n';
import { cn } from '@/utils/cn';

export function SettingsScreen() {
  const { settings, update } = useSettings();
  const showToast = useUiStore((s) => s.showToast);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'demo' | 'reset' | null>(null);

  const handleLoadDemo = async () => {
    if (!confirm(t('settings.demoConfirm'))) return;
    setBusy('demo');
    try {
      const res = await loadDemoData();
      const msg = t('settings.demoLoaded')
        .replace('{workouts}', String(res.workouts))
        .replace('{sets}', String(res.sets))
        .replace('{prs}', String(res.prs));
      showToast(msg, 'success');
    } catch (e) {
      showToast(`Demo: ${(e as Error).message}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    if (!confirm(t('settings.resetConfirm'))) return;
    setBusy('reset');
    try {
      await clearAllData();
      showToast(t('settings.resetDone'), 'success');
    } catch (e) {
      showToast(`Reset: ${(e as Error).message}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportJson = async () => {
    const payload = await buildExport();
    downloadFile(
      `gym-progress-${new Date().toISOString().slice(0, 10)}.json`,
      exportToJsonString(payload),
      'application/json',
    );
    showToast('Export hotový', 'success');
  };
  const exportCsv = async () => {
    const payload = await buildExport();
    const csv = '\uFEFF' + exportToCsv(payload);
    downloadFile(
      `gym-progress-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv;charset=utf-8',
    );
    showToast('CSV export hotový', 'success');
  };

  const handleImport = async (file: File, mode: 'merge' | 'replace') => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const v = validateImport(json);
      if (!v.ok) {
        showToast(`Import: ${v.reason}`, 'error');
        return;
      }
      await applyImport(v.data, mode);
      showToast(`Import hotový (${mode})`, 'success');
    } catch (e) {
      showToast(`Import zlyhal: ${(e as Error).message}`, 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('settings.title')} />
      <div className="space-y-6 px-4 py-4 md:max-w-2xl md:px-8">
        <section className="card p-4">
          <h2 className="mb-3 text-base font-semibold">{t('settings.formula')}</h2>
          <div className="space-y-2">
            {(['epley', 'brzycki', 'lesuer'] as OneRmFormula[]).map((f) => (
              <label
                key={f}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                  settings.oneRmFormula === f
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-[rgb(var(--border))]',
                )}
              >
                <input
                  type="radio"
                  name="formula"
                  value={f}
                  checked={settings.oneRmFormula === f}
                  onChange={() => update({ oneRmFormula: f })}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium capitalize">{f}</div>
                  <div className="text-xs text-[rgb(var(--text-muted))]">{formulaLabel(f)}</div>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">{t('settings.formulaInfo')}</p>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-base font-semibold">{t('settings.units')}</h2>
          <div className="flex gap-2">
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u}
                onClick={() => update({ units: u })}
                className={cn('btn', settings.units === u ? 'btn-primary' : 'btn-secondary')}
              >
                {u}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-base font-semibold">{t('settings.theme')}</h2>
          <div className="flex gap-2">
            {(
              [
                { key: 'light', icon: Sun, label: t('settings.light') },
                { key: 'dark', icon: Moon, label: t('settings.dark') },
                { key: 'system', icon: Monitor, label: t('settings.system') },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => update({ theme: key })}
                className={cn('btn', settings.theme === key ? 'btn-primary' : 'btn-secondary')}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-base font-semibold">{t('settings.export')}</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportJson} className="btn-secondary">
              <Download size={16} /> {t('settings.exportJson')}
            </button>
            <button onClick={exportCsv} className="btn-secondary">
              <Download size={16} /> {t('settings.exportCsv')}
            </button>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-1 text-base font-semibold">{t('settings.demo')}</h2>
          <p className="mb-3 text-xs text-[rgb(var(--text-muted))]">{t('settings.demoHint')}</p>
          <button onClick={handleLoadDemo} disabled={busy !== null} className="btn-primary">
            <Sparkles size={16} />
            {busy === 'demo' ? t('common.loading') : t('settings.loadDemo')}
          </button>
        </section>

        <section className="card border-red-300 p-4 dark:border-red-900">
          <h2 className="mb-1 text-base font-semibold text-red-700 dark:text-red-400">
            {t('settings.reset')}
          </h2>
          <p className="mb-3 text-xs text-[rgb(var(--text-muted))]">{t('settings.resetHint')}</p>
          <button
            onClick={handleReset}
            disabled={busy !== null}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 size={16} />
            {busy === 'reset' ? t('common.loading') : t('settings.reset')}
          </button>
        </section>

        <section className="card p-4">
          <h2 className="mb-1 text-base font-semibold">{t('settings.import')}</h2>
          <p className="mb-3 text-xs text-[rgb(var(--text-muted))]">{t('settings.importHint')}</p>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const mode = confirm('Stlač OK pre nahradenie všetkých dát, alebo Cancel pre zlúčenie.')
                ? 'replace'
                : 'merge';
              await handleImport(f, mode);
              if (fileInput.current) fileInput.current.value = '';
            }}
          />
          <div className="flex gap-2">
            <button onClick={() => fileInput.current?.click()} className="btn-secondary">
              <Upload size={16} /> Vybrať JSON…
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
