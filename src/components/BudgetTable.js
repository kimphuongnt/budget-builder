import React, { useState, useEffect, useCallback, useRef } from "react";

const BudgetTable = ({ months }) => {
  const [rows, setRows] = useState([
    {
      id: 1,
      name: "General Income",
      values: months.reduce((acc, month) => ({ ...acc, [month]: "" }), {}),
      subRows: [],
      category: "income",
    },
    {
      id: 2,
      name: "Other Income",
      values: months.reduce((acc, month) => ({ ...acc, [month]: "" }), {}),
      subRows: [],
      category: "income",
    },
    {
      id: 3,
      name: "Operational Expenses",
      values: months.reduce((acc, month) => ({ ...acc, [month]: "" }), {}),
      subRows: [],
      category: "expenses",
    },
  ]);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    cellData: null,
  });

  const handleInputChange = (rowId, month, value) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [month]: value } }
          : row
      )
    );
  };

  const handleSubRowInputChange = (rowId, subRowId, month, value) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              subRows: row.subRows.map((subRow) =>
                subRow.id === subRowId
                  ? { ...subRow, values: { ...subRow.values, [month]: value } }
                  : subRow
              ),
            }
          : row
      )
    );
  };

  const handleNameChange = (rowId, value) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === rowId ? { ...row, name: value } : row))
    );
  };

  const handleSubRowNameChange = (rowId, subRowId, value) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              subRows: row.subRows.map((subRow) =>
                subRow.id === subRowId ? { ...subRow, name: value } : subRow
              ),
            }
          : row
      )
    );
  };

  const inputRefs = useRef({});

  const handleKeyDown = (e, rowId, subRowId, month, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentRow = rows.find((row) => row.id === rowId);
      if (currentRow && currentRow.name.trim() !== "") {
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  subRows: [
                    ...row.subRows,
                    {
                      id: Date.now(),
                      name: "",
                      values: months.reduce(
                        (acc, month) => ({ ...acc, [month]: "" }),
                        {}
                      ),
                    },
                  ],
                }
              : row
          )
        );
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      deleteRow(rowId, subRowId);
    } else if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
      let newRowId = rowId;
      let newSubRowId = subRowId;
      let newMonth = month;
      let newIndex = index;

      if (e.key === "ArrowUp") {
        if (subRowId) {
          const currentRow = rows.find((row) => row.id === rowId);
          const subRowIndex = currentRow.subRows.findIndex(
            (sr) => sr.id === subRowId
          );
          if (subRowIndex > 0) {
            newSubRowId = currentRow.subRows[subRowIndex - 1].id;
          } else {
            newSubRowId = null;
          }
        } else {
          const rowIndex = rows.findIndex((row) => row.id === rowId);
          if (rowIndex > 0) {
            newRowId = rows[rowIndex - 1].id;
            const prevRow = rows[rowIndex - 1];
            if (prevRow.subRows.length > 0) {
              newSubRowId = prevRow.subRows[prevRow.subRows.length - 1].id;
            }
          }
        }
      } else if (e.key === "ArrowDown") {
        const currentRow = rows.find((row) => row.id === rowId);
        if (subRowId) {
          const subRowIndex = currentRow.subRows.findIndex(
            (sr) => sr.id === subRowId
          );
          if (subRowIndex < currentRow.subRows.length - 1) {
            newSubRowId = currentRow.subRows[subRowIndex + 1].id;
          } else {
            const rowIndex = rows.findIndex((row) => row.id === rowId);
            if (rowIndex < rows.length - 1) {
              newRowId = rows[rowIndex + 1].id;
              newSubRowId = null;
            }
          }
        } else {
          if (currentRow.subRows.length > 0) {
            newSubRowId = currentRow.subRows[0].id;
          } else {
            const rowIndex = rows.findIndex((row) => row.id === rowId);
            if (rowIndex < rows.length - 1) {
              newRowId = rows[rowIndex + 1].id;
            }
          }
        }
      } else if (e.key === "ArrowLeft") {
        newIndex = Math.max(0, index - 1);
        newMonth = months[newIndex];
      } else if (e.key === "ArrowRight") {
        newIndex = Math.min(months.length - 1, index + 1);
        newMonth = months[newIndex];
      }

      const nextInput =
        inputRefs.current[`${newRowId}-${newSubRowId}-${newMonth}`];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const calculateSubTotals = (name, month) => {
    return rows
      .filter((row) => row.name === name)
      .reduce((total, row) => {
        const rowTotal = parseInt(row.values[month]) || 0;
        const subRowTotal = row.subRows.reduce(
          (subTotal, subRow) =>
            subTotal + (parseInt(subRow.values[month]) || 0),
          0
        );
        return total + rowTotal + subRowTotal;
      }, 0);
  };

  const calculateCateTotals = (month, category) => {
    return rows
      .filter((row) => row.category === category)
      .reduce((total, row) => {
        const rowTotal = parseInt(row.values[month]) || 0;
        const subRowTotal = row.subRows.reduce(
          (subTotal, subRow) =>
            subTotal + (parseInt(subRow.values[month]) || 0),
          0
        );
        return total + rowTotal + subRowTotal;
      }, 0);
  };

  const calculateProfit = (month) => {
    const incomeTotals = calculateCateTotals(month, "income");
    const expenseTotals = calculateCateTotals(month, "expenses");
    return incomeTotals - expenseTotals;
  };

  const calculateOpeningBalance = (month) => {
    let openingBalance = 0;
    for (let i = 0; i < months.indexOf(month); i++) {
      const currentMonth = months[i];
      const profit = calculateProfit(currentMonth);
      openingBalance += profit;
    }
    return openingBalance;
  };

  const calculateClosingBalance = (month) => {
    const openingBalance = calculateOpeningBalance(month);
    const profit = calculateProfit(month);
    return openingBalance + profit;
  };

  const addNewParentCategory = (category) => {
    setRows((prevRows) => [
      ...prevRows,
      {
        id: Date.now(),
        name: "New Category",
        values: months.reduce((acc, month) => ({ ...acc, [month]: "" }), {}),
        subRows: [],
        category,
      },
    ]);
  };

  const deleteRow = (rowId, subRowId = null) => {
    setRows((prevRows) => {
      if (subRowId) {
        return prevRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                subRows: row.subRows.filter((subRow) => subRow.id !== subRowId),
              }
            : row
        );
      } else {
        return prevRows.filter((row) => row.id !== rowId);
      }
    });
  };

  const handleContextMenu = (e, rowId, subRowId, month) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      cellData: { rowId, subRowId, month },
    });
  };

  const handleApplyToAll = useCallback(() => {
    if (contextMenu.cellData) {
      const { rowId, subRowId, month } = contextMenu.cellData;

      setRows((prevRows) => {
        return prevRows.map((row) => {
          if (row.id === rowId) {
            if (subRowId) {
              return {
                ...row,
                subRows: row.subRows.map((subRow) => {
                  if (subRow.id === subRowId) {
                    const cellValue = subRow.values[month];
                    return {
                      ...subRow,
                      values: Object.keys(subRow.values).reduce(
                        (acc, m) => ({ ...acc, [m]: cellValue }),
                        {}
                      ),
                    };
                  }
                  return subRow;
                }),
              };
            } else {
              const cellValue = row.values[month];
              return {
                ...row,
                values: Object.keys(row.values).reduce(
                  (acc, m) => ({ ...acc, [m]: cellValue }),
                  {}
                ),
              };
            }
          }
          return row;
        });
      });

      setContextMenu({ ...contextMenu, visible: false });
    }
  }, [contextMenu, setRows]);

  console.log(contextMenu.cellData);
  const handleClickOutside = useCallback(() => {
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu]);

  useEffect(() => {
    // Add event listener to handle click outside
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const renderCategoryRows = (category) => {
    return rows
      .filter((row) => row.category === category)
      .map((row) => (
        <React.Fragment key={row.id}>
          <tr>
            <td className="font-bold border border-black">
              <input
                type="text"
                className="w-full border-none outline-none"
                value={row.name}
                onChange={(e) => handleNameChange(row.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, row.id, null, months[0], 0)}
                disabled={
                  row.name === "General Income" ||
                  row.name === "Other Income" ||
                  row.name === "Operational Expenses"
                }
                ref={(el) =>
                  (inputRefs.current[`${row.id}-null-${months[0]}`] = el)
                }
              />
            </td>
            {months.map((month, index) => (
              <td
                key={month}
                className="border border-black text-right"
                onContextMenu={(e) => handleContextMenu(e, row.id, null, month)}
              >
                <input
                  type="text"
                  className="w-full text-right border-none outline-none"
                  value={row.values[month]}
                  onChange={(e) =>
                    handleInputChange(row.id, month, e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, row.id, null, month, index)
                  }
                  ref={(el) =>
                    (inputRefs.current[`${row.id}-null-${month}`] = el)
                  }
                />
              </td>
            ))}
          </tr>
          {row.subRows.map((subRow) => (
            <tr key={subRow.id} className="">
              <td className="border border-black">
                <input
                  type="text"
                  className="w-full border-none outline-none"
                  value={subRow.name}
                  onChange={(e) =>
                    handleSubRowNameChange(row.id, subRow.id, e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, row.id, subRow.id, months[0], 0)
                  }
                  ref={(el) =>
                    (inputRefs.current[`${row.id}-${subRow.id}-${months[0]}`] =
                      el)
                  }
                />
                
              </td>
              {months.map((month, index) => (
                <td
                  key={month}
                  className="border border-black text-right"
                  onContextMenu={(e) =>
                    handleContextMenu(e, row.id, subRow.id, month)
                  }
                >
                  <input
                    type="text"
                    className="w-full text-right border-none outline-none"
                    value={subRow.values[month]}
                    onChange={(e) =>
                      handleSubRowInputChange(
                        row.id,
                        subRow.id,
                        month,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, row.id, subRow.id, month, index)
                    }
                    ref={(el) =>
                      (inputRefs.current[`${row.id}-${subRow.id}-${month}`] =
                        el)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr className="border border-black">
            <th className="text-left">Sub Totals</th>
            {months.map((month) => (
              <td key={month} className="border border-black text-right ">
                {calculateSubTotals(row.name, month)}
              </td>
            ))}
          </tr>
          <tr className="border border-black">
            <td>&nbsp;</td>
          </tr>
        </React.Fragment>
      ));
  };

  return (
    <div>
      <table className="w-full border border-black">
        <thead>
          <tr>
            <th className="border border-black text-left">
              Start period V End Period V
            </th>
            {months.map((month) => (
              <th key={month} className="border border-black text-right">
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="text-left">Income</th>
          </tr>
          {renderCategoryRows("income")}
          <tr className="border border-black">
            <th className="text-left">Income Totals</th>
            {months.map((month) => (
              <td key={month} className="border border-black text-right ">
                {calculateCateTotals(month, "income")}
              </td>
            ))}
          </tr>
          <tr className="border border-black">
            <td>&nbsp;</td>
          </tr>
          <tr>
            <th className="text-left">Expenses</th>
          </tr>
          {renderCategoryRows("expenses")}
          <tr className="border border-black">
            <th className="text-left">Totals Expenses</th>
            {months.map((month) => (
              <td key={month} className="border border-black text-right ">
                {calculateCateTotals(month, "expenses")}
              </td>
            ))}
          </tr>
          <tr className="border border-black">
            <th className="text-left">Profit/Loss</th>
            {months.map((month) => (
              <td key={month} className="border border-black text-right ">
                {calculateProfit(month)}
              </td>
            ))}
          </tr>
          <tr className="border border-black">
            <th className="text-left">Opening Balance</th>
            {months.map((month) => (
              <td key={month} className="border border-black text-right ">
                {calculateOpeningBalance(month)}
              </td>
            ))}
          </tr>
          <tr className="border border-black">
            <th className="text-left">Closing Balance</th>
            {months.map((month) => (
              <td key={month} className="border border-black text-right ">
                {calculateClosingBalance(month)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="mt-2">
        <button
          className="mr-2 p-2 bg-blue-500 text-white"
          onClick={() => addNewParentCategory("income")}
        >
          Add New Income Category
        </button>
        <button
          className="p-2 bg-red-500 text-white"
          onClick={() => addNewParentCategory("expenses")}
        >
          Add New Expense Category
        </button>
      </div>

      {contextMenu.visible && (
        <div
          className="context-menu absolute bg-white border border-gray-400"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block px-4 py-2 text-left"
            onClick={(e) => {
              e.stopPropagation();
              handleApplyToAll();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            Apply to All
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetTable;
