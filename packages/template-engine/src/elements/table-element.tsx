import type { TableProps } from "../schema/types"

export function TableElement({ props }: { props: TableProps }) {
  const { columns, rows, striped, borderColor, headerBackgroundColor, headerTextColor, fontSize } = props

  const border = borderColor ? `1px solid ${borderColor}` : "1px solid #e5e5e5"

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: fontSize ?? 11,
      }}
    >
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th
              key={i}
              style={{
                padding: "8px 12px",
                textAlign: col.align ?? "left",
                fontWeight: 600,
                borderBottom: "2px solid #333",
                border,
                width: col.width ?? undefined,
                backgroundColor: headerBackgroundColor ?? "#f9fafb",
                color: headerTextColor ?? undefined,
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr
            key={rowIdx}
            style={{
              backgroundColor: striped && rowIdx % 2 === 1 ? "#f9fafb" : undefined,
            }}
          >
            {row.map((cell, cellIdx) => (
              <td
                key={cellIdx}
                style={{
                  padding: "8px 12px",
                  textAlign: columns[cellIdx]?.align ?? "left",
                  border,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
