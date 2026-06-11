import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// A compact filter dropdown with an "all" sentinel. Value '' means no filter.
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
    <Select value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)}>
      <SelectTrigger size="sm" className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
