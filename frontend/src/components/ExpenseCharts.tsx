import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategorySummary, MonthlySummary } from "../api/client";

const COLORS = ["#5b8cff", "#57b894", "#e5b95a", "#e5605a", "#b06be0", "#4dd0c4"];

interface Props {
  categorySummary: CategorySummary[];
  monthlySummary: MonthlySummary[];
}

export default function ExpenseCharts({ categorySummary, monthlySummary }: Props) {
  return (
    <div className="chart-grid">
      <div className="chart-card">
        <h2>By category</h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={categorySummary}
              dataKey="total"
              nameKey="category"
              innerRadius={50}
              outerRadius={80}
            >
              {categorySummary.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h2>By month</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
            <XAxis dataKey="month" stroke="#9aa1ac" fontSize={12} />
            <YAxis stroke="#9aa1ac" fontSize={12} />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="total" fill="#5b8cff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
