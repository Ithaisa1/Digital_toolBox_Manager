/**
 * Categorías: crear, renombrar, editar la descripción y eliminar.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { categoryLabel, sortCategories } from '../../utils/categories';
import { Notice, SectionState } from './AdminCommon';
import { adminErrorMessage, useAdminData } from './useAdminData';

const CategoryForm = ({ initial = { name: '', description: '' }, submitLabel, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('adminPanel.categories.nameRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({ name: form.name.trim(), description: form.description.trim() });
    } catch (err) {
      setError(adminErrorMessage(t, err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-category-form" onSubmit={submit}>
      <input
        className="admin-input"
        value={form.name}
        maxLength={60}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder={t('adminPanel.categories.name')}
        aria-label={t('adminPanel.categories.name')}
      />
      <input
        className="admin-input"
        value={form.description}
        maxLength={200}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder={t('adminPanel.categories.description')}
        aria-label={t('adminPanel.categories.description')}
      />
      <div className="admin-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('adminPanel.categories.cancel')}</button>}
      </div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
    </form>
  );
};

const AdminCategories = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useAdminData('/categories');
  const [editingId, setEditingId] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState(null);

  const create = async (values) => {
    await api.post('/categories', values);
    setFormKey((k) => k + 1); // vaciar el formulario
    setNotice({ type: 'success', text: t('adminPanel.users.done') });
    reload();
  };

  const update = async (id, values) => {
    await api.put(`/categories/${id}`, values);
    setEditingId(null);
    setNotice({ type: 'success', text: t('adminPanel.users.done') });
    reload();
  };

  const remove = async (category) => {
    const count = category._count?.tools ?? 0;
    if (!window.confirm(t('adminPanel.categories.confirmDelete', { name: categoryLabel(t, category.name), count }))) return;
    try {
      await api.delete(`/categories/${category.id}`);
      setNotice({ type: 'success', text: t('adminPanel.users.done') });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: adminErrorMessage(t, err) });
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-card">
        <h2 className="admin-card-title">{t('adminPanel.categories.newTitle')}</h2>
        <CategoryForm key={formKey} submitLabel={t('adminPanel.categories.add')} onSubmit={create} />
        <p className="admin-muted admin-hint">{t('adminPanel.categories.defaultHint')}</p>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <SectionState loading={loading} error={error} onRetry={reload}>
        {data && (
          <ul className="admin-category-list">
            {sortCategories(data, t, i18n.language).map((category) => (
              <li key={category.id} className="admin-category">
                {editingId === category.id ? (
                  <CategoryForm
                    initial={{ name: category.name, description: category.description || '' }}
                    submitLabel={t('adminPanel.categories.save')}
                    onSubmit={(values) => update(category.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="admin-category-info">
                      <strong>{categoryLabel(t, category.name)}</strong>
                      {categoryLabel(t, category.name) !== category.name && <span className="admin-sub">{category.name}</span>}
                      {category.description && <span className="admin-sub">{category.description}</span>}
                    </div>
                    <span className="admin-category-count">
                      {t('adminPanel.categories.toolsCount', { count: category._count?.tools ?? 0 })}
                    </span>
                    <div className="admin-actions">
                      <button type="button" className="admin-btn" onClick={() => setEditingId(category.id)}>{t('adminPanel.categories.edit')}</button>
                      <button type="button" className="admin-btn is-danger" onClick={() => remove(category)}>{t('adminPanel.categories.delete')}</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionState>
    </div>
  );
};

export default AdminCategories;
