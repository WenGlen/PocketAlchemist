import { NPC_OPTIONS } from '../adminConstants';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function EntitySelect({ value, onChange, placeholder = '請選擇 NPC', className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {NPC_OPTIONS.map((n) => (
        <option key={n.id} value={n.id}>
          {n.emoji} {n.name} ({n.id})
        </option>
      ))}
    </select>
  );
}
