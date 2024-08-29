import React, { useState, useEffect, useCallback } from "react";

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

  const handleKeyDown = (e, rowId) => {
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
    }
  };

  const handleSubRowKeyDown = (e, rowId, subRowId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentRow = rows.find((row) => row.id === rowId);
      if (
        currentRow &&
        currentRow.subRows.find((subRow) => subRow.id === subRowId)
      ) {
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

  const handleContextMenu = (e, rowId, month) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      cellData: { rowId, month },
    });
  };

  const handleApplyToAll = () => {
    if (contextMenu.cellData) {
      const { rowId, month } = contextMenu.cellData;
      const cellValue = rows.find((row) => row.id === rowId).values[month];

      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                values: Object.keys(row.values).reduce(
                  (acc, m) => ({
                    ...acc,
                    [m]: cellValue,
                  }),
                  {}
                ),
              }
            : row
        )
      );

      setContextMenu({
        ...contextMenu,
        visible: false,
      });
    }
  };

  const handleClickOutside = useCallback(() => {
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu]);

  useEffect(() => {
    // Add event listener to handle click outside
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      // Clean up the event listener
      document.removeEventListener('mousedown', handleClickOutside);
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
                onKeyDown={(e) => handleKeyDown(e, row.id)}
                disabled={
                  row.name === "General Income" ||
                  row.name === "Other Income" ||
                  row.name === "Operational Expenses"
                }
              />
            </td>
            {months.map((month) => (
              <td
                key={month}
                className="border border-black text-right"
                onContextMenu={(e) => handleContextMenu(e, row.id, month)}
              >
                <input
                  type="text"
                  className="w-full text-right border-none outline-none"
                  value={row.values[month]}
                  onChange={(e) =>
                    handleInputChange(row.id, month, e.target.value)
                  }
                  onKeyDown={(e) => handleKeyDown(e, row.id)}
                />
              </td>
            ))}
          </tr>
          {row.subRows.map((subRow) => (
            <tr key={subRow.id} className="bg-gray-100">
              <td className="border border-black">
                <input
                  type="text"
                  className="w-full border-none outline-none"
                  value={subRow.name}
                  onChange={(e) =>
                    handleSubRowNameChange(row.id, subRow.id, e.target.value)
                  }
                  onKeyDown={(e) => handleSubRowKeyDown(e, row.id, subRow.id)}
                />
              </td>
              {months.map((month) => (
                <td
                  key={month}
                  className="border border-black text-right"
                  onContextMenu={(e) => handleContextMenu(e, row.id, month)}
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
                    onKeyDown={(e) => handleSubRowKeyDown(e, row.id, subRow.id)}
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
            onClick={handleApplyToAll}
          >
            Apply to All
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetTable;
