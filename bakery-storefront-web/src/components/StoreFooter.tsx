import type { Dictionary } from '@/i18n/dictionaries/types';

type StoreFooterProps = {
  dictionary: Dictionary;
  storeName?: string;
  address?: string;
  phone?: string;
  hours?: string;
};

export const StoreFooter = ({
  dictionary,
  storeName,
  address,
  phone,
  hours,
}: StoreFooterProps) => {
  const resolvedStoreName = storeName || dictionary.siteName;
  const resolvedAddress = address || dictionary.footer.address;
  const resolvedPhone = phone || dictionary.footer.phone;
  const resolvedHours = hours || dictionary.footer.hours;

  return (
    <footer className="store-footer" id="contact">
      <div className="footer-brand">
        <h3>{resolvedStoreName}</h3>
        <p>{resolvedAddress}</p>
      </div>

      <div className="footer-meta">
        <div className="footer-meta-item">
          <h4>{dictionary.footer.contactTitle}</h4>
          <p>{resolvedPhone}</p>
        </div>
        <div className="footer-meta-item">
          <h4>{dictionary.footer.hoursTitle}</h4>
          <p>{resolvedHours}</p>
        </div>
      </div>

      <small className="footer-note">© {new Date().getFullYear()} {resolvedStoreName}</small>
    </footer>
  );
};
