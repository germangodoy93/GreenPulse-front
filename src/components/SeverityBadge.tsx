import type { SeverityLevel } from '../types';

const styles: Record<SeverityLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[severity]}`}>
      {severity}
    </span>
  );
}
