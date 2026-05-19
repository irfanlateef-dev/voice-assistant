import { Link } from 'react-router-dom';
import { getAppPath } from '../../config/appLinks.js';

export default function AppLink({
  children,
  className = '',
  fallbackLabel,
  onClick,
  ...props
}) {
  return (
    <Link
      to={getAppPath()}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children ?? fallbackLabel ?? 'Get started'}
    </Link>
  );
}
