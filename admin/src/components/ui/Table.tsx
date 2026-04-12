import type { ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
};

export function Table<T>({ columns, rows, rowKey }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-semibold text-gray-700" key={column.key}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} key={rowKey(row)}>
              {columns.map((column) => (
                <td className="px-4 py-3 align-top text-gray-700" key={column.key}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
