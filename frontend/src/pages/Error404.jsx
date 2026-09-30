import { Link } from 'react-router-dom';
import { primaryButton } from '../helpers/ui.js';

export default function Error404() {
  return <div className="mx-auto max-w-6xl px-6 py-24 text-center"><p className="text-sm font-bold text-brand">404</p><h1 className="mt-3 font-display text-4xl font-bold">No encontramos esta página</h1><Link to="/eventos" className={`${primaryButton} mt-8`}>Volver a los eventos</Link></div>;
}
