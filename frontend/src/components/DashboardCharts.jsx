/**
 * Gráficos hechos con HTML/CSS (sin librerías) para que hereden el tema claro/oscuro.
 * - HorizontalBarChart y MonthlyColumnChart: genéricos (los usa también el panel de admin).
 * - CostByCategoryChart y UpcomingPaymentsChart: los del Dashboard del usuario.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import { categoryColor, categoryLabel } from '../utils/categories';
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

/**
 * Barras horizontales con el valor al lado.
 * @param {{title: string, subtitle?: React.ReactNode, rows: {key: string, label: string, value: number, color?: string}[], format?: (n: number) => string}} props
 */
export const HorizontalBarChart = ({ title, subtitle, rows, format = String }) => {
  const max = Math.max(...rows.map((r) => r.value), 0);

  return (
    <figure className="chart">
      <figcaption className="chart-header">
        <h2>{title}</h2>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </figcaption>

      <ul className="hbar-list">
        {rows.map((row) => (
          <li key={row.key} className="hbar-row">
            <span className="hbar-label" title={row.label}>{row.label}</span>
            <span className="hbar-track">
              <span
                className="hbar-bar"
                style={{ width: `${max > 0 ? (row.value / max) * 100 : 0}%`, ...(row.color && { '--cat': row.color }) }}
              />
            </span>
            <span className="hbar-value">{format(row.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
};

/**
 * Columnas por mes con tooltip al pasar el ratón o el teclado.
 * @param {{title: string, subtitle?: React.ReactNode, data: {month: string, value: number}[], format?: (n: number) => string, tickFormat?: (n: number) => string, minMax?: number}} props
 */
export const MonthlyColumnChart = ({ title, subtitle, data, format = String, tickFormat, minMax = 0, integer = false }) => {
  const { i18n } = useTranslation();
  const [active, setActive] = useState(null);

  const locale = i18n.language || 'es';
  const toDate = (month) => {
    const [year, m] = month.split('-').map(Number);
    return new Date(Date.UTC(year, m - 1, 1));
  };
  const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const longMonthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const longMonth = (date) => {
    const text = longMonthFormat.format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  let max = niceMax(Math.max(minMax, ...data.map((d) => d.value), 0));
  // Recuentos (personas, acciones): que la marca del medio sea un número entero
  if (integer && max % 2 !== 0) max += 1;
  const ticks = [max, max / 2, 0];

  return (
    <figure className="chart">
      <figcaption className="chart-header">
        <h2>{title}</h2>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </figcaption>

      <div className="cols" onMouseLeave={() => setActive(null)}>
        <div className="cols-axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="cols-tick">{(tickFormat || format)(tick)}</span>
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
                aria-label={`${longMonth(date)}: ${format(item.value)}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              >
                <span className="cols-bar-area">
                  <span className="cols-bar" style={{ height: `${(item.value / max) * 100}%` }} />
                </span>
                <span className="cols-label">
                  {label}
                  {(index === 0 || date.getUTCMonth() === 0) && (
                    <span className="cols-year">{date.getUTCFullYear()}</span>
                  )}
                </span>

                {active === index && (
                  <span className="chart-tooltip" role="tooltip">
                    <span className="chart-tooltip-title">{longMonth(date)}</span>
                    <span className="chart-tooltip-value">{format(item.value)}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Versión en tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((item) => (
            <tr key={item.month}>
              <th scope="row">{longMonth(toDate(item.month))}</th>
              <td>{format(item.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

const euroTick = (n) => formatEuro(n).replace(/,00/, '');

/** Coste mensual por categoría (Dashboard y panel de admin). */
export const CostByCategoryChart = ({ data, title, subtitle }) => {
  const { t } = useTranslation();
  const otherLabel = t('dashboard.charts.other');
  const rows = foldCategories(data, otherLabel).map((row) => ({
    key: row.category,
    label: categoryLabel(t, row.category),
    value: row.monthlyCost,
    color: categoryColor(row.category === otherLabel ? 'Other' : row.category),
  }));

  return (
    <HorizontalBarChart
      title={title || t('dashboard.charts.costByCategory')}
      subtitle={subtitle ?? t('dashboard.charts.costByCategoryHint')}
      rows={rows}
      format={formatEuro}
    />
  );
};

/** Pagos previstos para los próximos 12 meses. */
export const UpcomingPaymentsChart = ({ data }) => {
  const { t } = useTranslation();
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <MonthlyColumnChart
      title={t('dashboard.charts.upcomingPayments')}
      subtitle={<>{t('dashboard.charts.next12Months')} · <strong>{formatEuro(total)}</strong></>}
      data={data.map((d) => ({ month: d.month, value: d.amount }))}
      format={formatEuro}
      tickFormat={euroTick}
    />
  );
};
