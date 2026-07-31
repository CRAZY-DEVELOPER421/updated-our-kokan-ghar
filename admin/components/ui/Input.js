'use client';

export default function Input({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-konkan-text-primary mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`input-field ${error ? 'border-konkan-error focus:ring-konkan-error/30' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-konkan-error">{error}</p>
      )}
    </div>
  );
}
