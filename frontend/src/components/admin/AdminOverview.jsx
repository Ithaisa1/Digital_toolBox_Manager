/**
 * Resumen: KPIs de la plataforma, gráficos y actividad reciente.
 */
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../../utils/formatCurrency';
import { CostByCategoryChart, HorizontalBarChart, MonthlyColumnChart } from '../DashboardCharts';
import { KpiCard, SectionState } from './AdminCommon';
import { formatDate, useAdminData } from './useAdminData';
import { describeMovement } from '../../utils/movements';

const AdminOverview = ({ onSeeActivity }) => {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useAdminData('/admin/overview');
  const n = (value) => new Intl.NumberFormat(i18n.language).format(value ?? 0);

  return (
    <SectionState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="admin-overview">
          <div className="admin-kpis">
            <KpiCard
              label={t('adminPanel.kpi.users')}
              value={n(data.users.total)}
              hint={t('adminPanel.kpi.usersHint', { admins: data.users.admins, blocked: data.users.blocked })}
            />
            <KpiCard label={t('adminPanel.kpi.active30')} value={n(data.users.active30d)} hint={`${t('adminPanel.kpi.new30')}: ${n(data.users.new30d)}`} />
            <KpiCard
              label={t('adminPanel.kpi.monthlySpend')}
              value={formatEuro(data.subscriptions.monthlySpend)}
              hint={t('adminPanel.kpi.yearlyHint', { yearly: formatEuro(data.subscriptions.yearlySpend) })}
            />
            <KpiCard
              label={t('adminPanel.kpi.subscriptions')}
              value={n(data.subscriptions.byStatus.ACTIVE)}
              hint={t('adminPanel.kpi.subscriptionsHint', { total: n(data.subscriptions.total) })}
            />
            <KpiCard label={t('adminPanel.kpi.tools')} value={n(data.tools.total)} hint={`${t('adminPanel.kpi.categories')}: ${n(data.categories)}`} />
            <KpiCard label={t('adminPanel.kpi.activity30')} value={n(data.activity30d)} />
          </div>

          <div className="admin-charts">
            <div className="admin-card">
              <MonthlyColumnChart
                title={t('adminPanel.charts.signups')}
                subtitle={t('adminPanel.charts.signupsHint')}
                data={data.charts.signupsByMonth.map((d) => ({ month: d.month, value: d.count }))}
                format={(v) => n(v)}
                minMax={4}
                integer
              />
            </div>
            <div className="admin-card">
              <CostByCategoryChart
                data={data.charts.spendByCategory}
                title={t('adminPanel.charts.spendByCategory')}
                subtitle={t('adminPanel.charts.spendHint')}
              />
            </div>
            <div className="admin-card">
              <HorizontalBarChart
                title={t('adminPanel.charts.topTools')}
                subtitle={t('adminPanel.charts.topToolsHint')}
                rows={data.charts.topTools.map((tool) => ({ key: tool.name, label: tool.name, value: tool.users }))}
                format={(v) => n(v)}
              />
            </div>
            <div className="admin-card">
              <h2 className="admin-card-title">{t('adminPanel.recentActivity')}</h2>
              <ul className="admin-feed">
                {data.recentActivity.map((item) => (
                  <li key={item.id}>
                    <span className={`admin-type admin-type-${item.type}`}>{t(`adminPanel.activity.types.${item.type}`, item.type)}</span>
                    <span className="admin-feed-text">
                      <strong>{item.user?.name}</strong> · {describeMovement(t, item.description)}
                    </span>
                    <time className="admin-feed-time" dateTime={item.createdAt}>{formatDate(item.createdAt, i18n.language, true)}</time>
                  </li>
                ))}
              </ul>
              <button type="button" className="admin-link-btn" onClick={onSeeActivity}>{t('adminPanel.seeAll')} →</button>
            </div>
          </div>
        </div>
      )}
    </SectionState>
  );
};

export default AdminOverview;
