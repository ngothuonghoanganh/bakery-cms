/**
 * Card component
 * Atomic UI component for content containers
 */

import type { CardProps } from './Card.types';
import './Card.styles.css';

export const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  onClick,
  hoverable = false,
}: CardProps): React.JSX.Element => {
  const classNames = [
    'card',
    hoverable || onClick ? 'card-hoverable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-content">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};
