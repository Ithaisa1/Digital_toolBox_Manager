/**
 * Gráficos del dashboard: coste mensual por categoría y pagos previstos por mes.
 * Hechos con HTML/CSS (sin librerías) para que hereden el tema claro/oscuro.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { categoryLabel } from '../utils/categories';
import './DashboardCharts.css';

const MAX_CATEGORIES = 6;

/** Deja las N categorías más caras y agrupa el resto en "Otras". */
const foldCategories = (data, otherLabel) => {
  if (data.length <= MAX_CATEGORIES) return data;
  const top = data.slice(0, MAX_CATEGORIES - 1);
  const rest = data.slice(MAX_CATEGORIES - 1).reduce((sum, item) => sum + item.monthlyCost, 0);
  return [...top, { category: otherLabel, monthlyCost: Math.round(rest * 100) / 100 }];
};

/** Calcula un máximo "redondo" para el eje (p. ej. 87 → 100). */
const niceMax = (value) => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value);
  return step * magnitude;
};

export const CostByCategoryChart = ({ data }) => {
  const { t } = useTranslation();
  const rows = foldCategories(data, t('dashboard.charts.other'));
  const max = Math.max(...rows.map((r) => r.monthlyCost), 0);

  return (
    <figure className="chart">
      <figcaption className="chart-header">
        <h2>{t('dashboard.charts.costByCategory')}</h2>
        <p className="chart-subtitle">{t('dashboard.charts.costByCategoryHint')}</p>
      </figcaption>

      <ul className="hbar-list">
        {rows.map((row) => (
          <li key={row.category} className="hbar-row">
            <span className="hbar-label" title={categoryLabel(t, row.category)}>{categoryLabel(t, row.category)}</span>
            <span className="hbar-track">
              <span
                className="hbar-bar"
                style={{ width: `${max > 0 ? (row.monthlyCost / max) * 100 : 0}%` }}
              />
            </span>
            <span className="hbar-value">{formatEuro(row.monthlyCost)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
};

export const UpcomingPaymentsChart = ({ data }) => {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState(null);

  const locale = i18n.language || 'es';
  const toDate = (month) => {
    const [year, m] = month.split('-').map(Number);
    return new Date(Date.UTC(year, m - 1, 1));
  };
  const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const longMonthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const longMonth = { format: (date) => {
    const text = longMonthFormat.format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  } };

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const max = niceMax(Math.max(...data.map((d) => d.amount), 0));
  const ticks = [max, max / 2, 0];

  return (
    <figure className="chart">
      <figcaption className="chart-header">
        <h2>{t('dashboard.charts.upcomingPayments')}</h2>
        <p className="chart-subtitle">
          {t('dashboard.charts.next12Months')} · <strong>{formatEuro(total)}</strong>
        </p>
      </figcaption>

      <div className="cols" onMouseLeave={() => setActive(null)}>
        <div className="cols-axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="cols-tick">{formatEuro(tick).replace(/,00/, '')}</span>
          ))}
        </div>

        <div className="cols-plot">
          <span className="cols-grid-layer" aria-hidden="true">
            {ticks.map((tick) => (
              <span
                key={tick}
                className={`cols-grid ${tick === 0 ? 'cols-baseline' : ''}`}
                style={{ bottom: `${(tick / max) * 100}%` }}
              />
            ))}
          </span>

          {data.map((item, index) => {
            const date = toDate(item.month);
            const label = shortMonth.format(date).replace('.', '');
            return (
              <div
                key={item.month}
                className={`cols-slot ${active === index ? 'is-active' : ''}`}
                tabIndex={0}
                aria-label={`${longMonth.format(date)}: ${formatEuro(item.amount)}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              >
                <span className="cols-bar-area">
                  <span className="cols-bar" style={{ height: `${(item.amount / max) * 100}%` }} />
                </span>
                <span className="cols-label">
                  {label}
                  {(index === 0 || date.getUTCMonth() === 0) && (
                    <span className="cols-year">{date.getUTCFullYear()}</span>
                  )}
                </span>

                {active === index && (
                  <span className="chart-tooltip" role="tooltip">
                    <span className="chart-tooltip-title">{longMonth.format(date)}</span>
                    <span className="chart-tooltip-value">{formatEuro(item.amount)}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Versión en tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>{t('dashboard.charts.upcomingPayments')}</caption>
        <tbody>
          {data.map((item) => (
            <tr key={item.month}>
              <th scope="row">{longMonth.format(toDate(item.month))}</th>
              <td>{formatEuro(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
