/**
 * Aviso fijo en la web de demo: los datos son de ejemplo y se reinician cada noche.
 */
import { useTranslation } from 'react-i18next';
import { useMeta } from '../hooks/useMeta';

const DemoBanner = () => {
  const { t } = useTranslation();
  const { demo } = useMeta();
  if (!demo) return null;

  return (
    <div className="demo-banner" role="note">
      <span aria-hidden="true">🧪</span> {t('demo.banner')}
    </div>
  );
};

export default DemoBanner;
