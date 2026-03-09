import { ITEM_OPTIONS } from '../adminConstants';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function ItemSelect({ value, onChange, placeholder = '請選擇道具', className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {ITEM_OPTIONS.map((item) => (
        <option key={item.id} value={item.id}>
          {item.emoji} {item.name} ({item.id})
        </option>
      ))}
    </select>
  );
}
