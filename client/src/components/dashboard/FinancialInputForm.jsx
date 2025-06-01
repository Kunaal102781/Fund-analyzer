import { useState } from "react";

const FinancialInputForm = ({ onSubmit }) => {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ income, expenses });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Income: <input value={income} onChange={(e) => setIncome(e.target.value)} /></label>
      <label>Expenses: <input value={expenses} onChange={(e) => setExpenses(e.target.value)} /></label>
      <button type="submit">Submit</button>
    </form>
  );
};

export default FinancialInputForm;
