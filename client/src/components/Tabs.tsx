const DEFAULT_CONTAINER = 'flex flex-wrap gap-2 border-b border-[--border-color] pb-3';
const DEFAULT_BUTTON =
  'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-200';
const DEFAULT_ACTIVE = 'bg-[#1c2637] text-white';
const DEFAULT_INACTIVE = 'text-[#8b949e] hover:text-white';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  containerClass?: string;
  buttonClass?: string;
  activeClass?: string;
  inactiveClass?: string;
}

export default function Tabs({
  tabs,
  value,
  onChange,
  containerClass = '',
  buttonClass = '',
  activeClass = '',
  inactiveClass = '',
}: TabsProps) {
  if (!tabs?.length || typeof onChange !== 'function') {
    return null;
  }

  return (
    <div className={`${DEFAULT_CONTAINER} ${containerClass}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`${DEFAULT_BUTTON} ${buttonClass} ${isActive ? `${DEFAULT_ACTIVE} ${activeClass}` : `${DEFAULT_INACTIVE} ${inactiveClass}`}`}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
