import { Combobox } from '@/components/app/Combobox'

// A compact filter dropdown with an "all" sentinel. Value '' means no filter.
// Backed by the searchable Combobox so any filter can be typed into.
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel = 'All',
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
  placeholder?: string
  className?: string
}) {
  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder ?? allLabel}
      allowClear
      clearLabel={allLabel}
      className={className}
    />
  )
}
