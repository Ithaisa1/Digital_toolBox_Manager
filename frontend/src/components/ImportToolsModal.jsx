/**
 * Ventana para importar herramientas desde un CSV.
 * Pasos: elegir archivo → vista previa (el servidor valida sin guardar) → importar.
 * Usa los estilos de modal de ToolsList.css.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { formatEuro } from '../utils/formatCurrency';
import './ImportToolsModal.css';

const MAX_FILE_BYTES = 1024 * 1024;

const TEMPLATE = [
  'nombre;tipo;url;precio;categoria;estado;descripcion',
  'Figma;Diseño;figma.com;15,00;Design;Activa;Diseño colaborativo',
  'VS Code;IDE;code.visualstudio.com;0;Development;Activa;Editor de código',
].join('\r\n');

/** Descarga la plantilla CSV (con BOM para que Excel lea bien los acentos). */
const downloadTemplate = () => {
  const blob = new Blob(['\uFEFF' + TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-herramientas.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const ImportToolsModal = ({ isOpen, onClose, onImported }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [step, setStep] = useState('select'); // select | preview | done
  const [fileName, setFileName] = useState('');
  const [csv, setCsv] = useState('');
  const [plan, setPlan] = useState(null);
  const [created, setCreated] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setStep('select');
    setFileName('');
    setCsv('');
    setPlan(null);
    setCreated(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  const errorMessage = (err) => {
    const code = err.response?.data?.code;
    return code ? t(`import.errors.${code}`, { max: err.response.data.maxRows }) : t('import.errors.generic');
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');

    if (file.size > MAX_FILE_BYTES) {
      setError(t('import.errors.fileTooLarge'));
      return;
    }

    setBusy(true);
    try {
      const text = await file.text();
      const response = await api.post('/tools/import', { csv: text, dryRun: true });
      setFileName(file.name);
      setCsv(text);
      setPlan(response.data);
      setStep('preview');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/tools/import', { csv, dryRun: false });
      setCreated(response.data.created);
      setStep('done');
      onImported?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const rowNote = (row) => {
    if (row.result === 'invalid') return row.errors.map((code) => t(`import.rowErrors.${code}`)).join(' · ');
    if (row.result === 'duplicate') return t('import.duplicateNote');
    if (row.warnings.includes('unknownCategory')) return t('import.unknownCategory', { name: row.data.categoryName });
    return '';
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div
        className="modal-content import-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
      >
        <div className="modal-header">
          <h2 id="import-title">{t('import.title')}</h2>
          <button className="modal-close" onClick={close} aria-label={t('import.close')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {step === 'select' && (
            <>
              <p className="import-intro">{t('import.intro')}</p>

              <label
                className={`import-drop ${dragging ? 'is-dragging' : ''} ${busy ? 'is-busy' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  disabled={busy}
                />
                <span className="import-drop-icon" aria-hidden="true">📄</span>
                <strong>{busy ? t('import.reading') : t('import.chooseFile')}</strong>
                <span className="import-drop-hint">{t('import.dropHint')}</span>
              </label>

              <div className="import-help">
                <p>{t('import.columnsHelp')}</p>
                <button type="button" className="import-link" onClick={downloadTemplate}>
                  {t('import.downloadTemplate')}
                </button>
              </div>
            </>
          )}

          {step === 'preview' && plan && (
            <>
              <p className="import-file">{fileName}</p>

              <ul className="import-summary">
                <li className="is-new"><strong>{plan.summary.valid}</strong> {t('import.summary.new')}</li>
                <li className="is-duplicate"><strong>{plan.summary.duplicates}</strong> {t('import.summary.duplicates')}</li>
                <li className="is-invalid"><strong>{plan.summary.invalid}</strong> {t('import.summary.invalid')}</li>
              </ul>

              <div className="import-table-wrap">
                <table className="import-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('import.columns.line')}</th>
                      <th scope="col">{t('import.columns.name')}</th>
                      <th scope="col">{t('import.columns.price')}</th>
                      <th scope="col">{t('import.columns.result')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.rows.map((row) => (
                      <tr key={row.line} className={`is-${row.result}`}>
                        <td className="import-line">{row.line}</td>
                        <td>
                          <span className="import-name">{row.data.name || '—'}</span>
                          {row.data.type && <span className="import-sub">{row.data.type}</span>}
                        </td>
                        <td className="import-price">
                          {row.data.price === null ? '—' : row.data.price === 0 ? t('import.free') : formatEuro(row.data.price)}
                        </td>
                        <td>
                          <span className={`import-badge is-${row.result}`}>{t(`import.result.${row.result}`)}</span>
                          {rowNote(row) && <span className="import-sub">{rowNote(row)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="import-done">
              <span className="import-done-icon" aria-hidden="true">✅</span>
              <p>{t('import.doneMessage', { count: created })}</p>
            </div>
          )}

          {error && <p className="import-error" role="alert">{error}</p>}
        </div>

        <div className="import-actions">
          {step === 'preview' && (
            <>
              <button type="button" className="btn btn-secondary" onClick={reset} disabled={busy}>
                {t('import.chooseAnother')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={busy || plan.summary.valid === 0}
              >
                {busy
                  ? t('common.loading')
                  : plan.summary.valid === 0
                    ? t('import.nothingToImport')
                    : t('import.confirm', { count: plan.summary.valid })}
              </button>
            </>
          )}
          {step === 'done' && (
            <button type="button" className="btn btn-primary" onClick={close}>
              {t('import.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportToolsModal;
