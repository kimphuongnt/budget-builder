import React, { useState } from "react";
import BudgetTable from "./BudgetTable";

const BudgetBuilder = () => {
  const [startMonth, setStartMonth] = useState("2024-01");
  const [endMonth, setEndMonth] = useState("2024-12");

  const generateMonths = (start, end) => {
    const months = [];
    const [startYear, startMonthIndex] = start.split("-").map(Number);
    const [endYear, endMonthIndex] = end.split("-").map(Number);
    const startDate = new Date(startYear, startMonthIndex - 1);
    const endDate = new Date(endYear, endMonthIndex - 1);

    while (startDate <= endDate) {
      months.push(
        startDate.toLocaleString("default", { month: "long", year: "numeric" })
      );
      startDate.setMonth(startDate.getMonth() + 1);
    }
    return months;
  };

  const months = generateMonths(startMonth, endMonth);

  const handleStartMonthChange = (e) => {
    setStartMonth(e.target.value);
  };

  const handleEndMonthChange = (e) => {
    setEndMonth(e.target.value);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex space-x-4">
        <input
          type="month"
          value={startMonth}
          onChange={handleStartMonthChange}
          className="p-2 border rounded"
        />
        <input
          type="month"
          value={endMonth}
          onChange={handleEndMonthChange}
          className="p-2 border rounded"
        />
      </div>
      <BudgetTable months={months} />
    </div>
  );
};

export default BudgetBuilder;
