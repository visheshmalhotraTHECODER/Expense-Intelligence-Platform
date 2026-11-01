import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("expense_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on any non-auth route means the stored token expired or was revoked,
// so drop the dead session rather than leaving the UI in a broken signed-in state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("expense_token");
      localStorage.removeItem("expense_user");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

export interface CategorySummary {
  category: string;
  total: number;
}

export interface MonthlySummary {
  month: string;
  total: number;
}

export async function signup(email: string, password: string, name: string) {
  const res = await api.post<{ token: string; user: User }>("/auth/signup", {
    email,
    password,
    name,
  });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post<{ token: string; user: User }>("/auth/login", {
    email,
    password,
  });
  return res.data;
}

export async function fetchExpenses() {
  const res = await api.get<Expense[]>("/expenses");
  return res.data;
}

export async function createExpense(input: {
  amount: number;
  category: string;
  description?: string;
  date: string;
}) {
  const res = await api.post<Expense>("/expenses", input);
  return res.data;
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}

export async function fetchCategorySummary() {
  const res = await api.get<CategorySummary[]>("/expenses/summary/by-category");
  return res.data;
}

export async function fetchMonthlySummary() {
  const res = await api.get<MonthlySummary[]>("/expenses/summary/by-month");
  return res.data;
}
