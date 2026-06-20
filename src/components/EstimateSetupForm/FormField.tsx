interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FormField({ label, children, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--cc-burnt-sienna)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: '8px 10px',
  border: '1px solid var(--cc-gray-light)',
  backgroundColor: '#fff',
  color: 'var(--cc-black)',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  fontFamily: 'var(--font-body)',
} as const;

interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  placeholder?: string;
  required?: boolean;
}

export function TextInput({ value, onChange, onBlur, placeholder, required }: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      style={inputStyle}
    />
  );
}

interface DateInputProps {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
}

export function DateInput({ value, onChange, onBlur }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={inputStyle}
    />
  );
}

interface TextAreaProps {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  placeholder?: string;
  rows?: number;
}

export function TextArea({ value, onChange, onBlur, placeholder, rows = 4 }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, resize: 'vertical' }}
    />
  );
}

interface PercentInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onBlur: () => void;
}

export function PercentInput({ label, value, onChange, onBlur }: PercentInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
      >
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="1"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onBlur}
          style={{ ...inputStyle, width: '80px' }}
        />
        <span style={{ color: 'var(--cc-gray-mid)', fontSize: '14px' }}>%</span>
      </div>
    </div>
  );
}
