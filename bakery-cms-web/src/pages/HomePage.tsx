/**
 * Home Page
 */

import { useTranslation } from 'react-i18next';

export const HomePage = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">{t('home.title', 'Bakery CMS')}</h1>
      <p className="text-lg text-gray-600">{t('home.welcome', 'Welcome to the Cookie Sales Management System')}</p>
    </div>
  );
};
