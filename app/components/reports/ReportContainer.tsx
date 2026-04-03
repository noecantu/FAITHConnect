interface ReportContainerProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ReportContainer({ title, actions, children, footer }: ReportContainerProps) {
  return (
    <div className="space-y-2 w-full">

      {/* Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold text-white/90">{title}</h2>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {/* Main content (table, charts, etc.) */}
      <div className="w-full">
        {children}
      </div>

      {/* Footer with reserved space */}
      <div className="pt-2 pb-2">
        {footer}
      </div>
    </div>
  );
}
