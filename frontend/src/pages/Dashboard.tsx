import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import {
  createExpense,
  deleteExpense,
  fetchCategorySummary,
  fetchExpenses,
  fetchMonthlySummary,
  type CategorySummary,
  type Expense,
  type MonthlySummary,
} from "../api/client";

// Recharts is by far the heaviest dependency here and is only needed once the
// user actually has expenses, so it's split out of the main bundle.
const ExpenseCharts = lazy(() => import("../components/ExpenseCharts"));

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    const [expensesData, categoryData, monthlyData] = await Promise.all([
      fetchExpenses(),
      fetchCategorySummary(),
      fetchMonthlySummary(),
    ]);
    setExpenses(expensesData);
    setCategorySummary(categoryData);
    setMonthlySummary(monthlyData);
  }

  useEffect(() => {
    loadAll()
      .catch(() => setError("Couldn't load your expenses. Please refresh to try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddExpense(e: FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await createExpense({
        amount: parsedAmount,
        category: category.trim(),
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
      });
      setAmount("");
      setCategory("");
      setDescription("");
      await loadAll();
    } catch {
      setError("Couldn't save that expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id);
      await loadAll();
    } catch {
      setError("Couldn't delete that expense. Please try again.");
    }
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <h1>Expenses</h1>
      <p className="total-line">
        Total spent: <strong>${total.toFixed(2)}</strong>
      </p>

      {error && <p className="form-error">{error}</p>}

      <form className="expense-form" onSubmit={handleAddExpense}>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="submit" disabled={submitting || !amount || !category.trim()}>
          Add expense
        </button>
      </form>

      {expenses.length > 0 && (
        <Suspense fallback={<div className="chart-grid" />}>
          <ExpenseCharts categorySummary={categorySummary} monthlySummary={monthlySummary} />
        </Suspense>
      )}

      {expenses.length === 0 ? (
        <p className="empty-state">No expenses yet. Add your first one above.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((expense) => (
            <li key={expense.id} className="expense-item">
              <div>
                <span className="expense-category">{expense.category}</span>
                {expense.description && (
                  <span className="expense-description"> — {expense.description}</span>
                )}
                <div className="expense-date">{expense.date.slice(0, 10)}</div>
              </div>
              <div className="expense-actions">
                <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                <button className="btn-link" onClick={() => handleDelete(expense.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
