type DataTablePlaceholderProps = {
  title: string;
  description?: string;
  columns: string[];
  rows: string[][];
};

export function DataTablePlaceholder({
  title,
  description,
  columns,
  rows,
}: DataTablePlaceholderProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-ink-950/10 bg-white shadow-sm">
      <div className="border-b border-ink-950/10 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-5 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {rows.map((row) => (
              <tr key={row.join("-")} className="text-ink-700">
                {row.map((cell) => (
                  <td key={cell} className="whitespace-nowrap px-5 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

