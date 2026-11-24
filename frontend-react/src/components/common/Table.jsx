// Reusable data table.
// Props:
//   columns: array of { key, header, render? }. If render is given, it receives (row).
//   data: array of row objects.
//   rowKey: name of the unique field in each row (default "id").
//   emptyMessage: text shown when data is empty.

function Table({
  columns = [],
  data = [],
  rowKey = "id",
  emptyMessage = "No records found.",
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brass/40 bg-white/60 shadow-soft">
      <table className="min-w-full text-left text-sm">
        <thead className="brass-header">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="whitespace-nowrap px-4 py-3 font-semibold"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length || 1}
                className="px-4 py-10 text-center text-taupe"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                className="border-t border-brass/20 transition hover:bg-caramel/10"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle text-cocoa">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
