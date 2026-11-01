import { expect, test, type Page } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/signup");
  await page.fill('input[type="text"]', "Test User");
  await page.fill('input[type="email"]', uniqueEmail());
  await page.fill('input[type="password"]', "supersecret");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
  await page.waitForSelector(".empty-state");
}

async function addExpense(
  page: Page,
  amount: string,
  category: string,
  description: string,
  date: string,
) {
  await page.fill('input[placeholder="Amount"]', amount);
  await page.fill('input[placeholder="Category"]', category);
  await page.fill('input[placeholder="Description (optional)"]', description);
  await page.fill('input[type="date"]', date);
  await page.click('button:has-text("Add expense")');
  await expect(page.getByText(description)).toBeVisible();
}

test.describe("Expensely", () => {
  test("a new account starts empty with a zero total", async ({ page }) => {
    await signUp(page);
    await expect(page.getByText("No expenses yet")).toBeVisible();
    await expect(page.getByText("$0.00")).toBeVisible();
  });

  test("expenses are listed and the total adds up", async ({ page }) => {
    await signUp(page);
    await addExpense(page, "42.50", "Food", "Groceries", "2026-01-15");
    await addExpense(page, "65.00", "Transit", "Monthly pass", "2026-01-05");

    await expect(page.locator(".expense-item")).toHaveCount(2);
    await expect(page.getByText("$107.50")).toBeVisible();
  });

  test("the lazy-loaded charts render once there is data", async ({ page }) => {
    await signUp(page);
    await addExpense(page, "60.50", "Food", "Groceries", "2026-01-15");
    await addExpense(page, "65.00", "Transit", "Monthly pass", "2026-01-05");
    await addExpense(page, "120.00", "Books", "Textbooks", "2026-02-20");

    // Wait on drawn geometry rather than any <svg>: the legend renders its own
    // icon SVGs well before the chart surface is painted.
    await expect(page.locator("path.recharts-sector")).toHaveCount(3);
    await expect(page.locator(".recharts-bar-rectangle")).toHaveCount(2);
  });

  test("an expense can be deleted", async ({ page }) => {
    await signUp(page);
    await addExpense(page, "20.00", "Coffee", "Flat white", "2026-01-02");
    await expect(page.locator(".expense-item")).toHaveCount(1);

    await page.locator(".expense-item").first().locator('button:has-text("Delete")').click();
    await expect(page.locator(".expense-item")).toHaveCount(0);
  });

  test("data is persisted, not just local state", async ({ page }) => {
    await signUp(page);
    await addExpense(page, "33.00", "Food", "Survives reload", "2026-03-01");

    await page.reload();
    await expect(page.locator(".expense-item")).toHaveCount(1);
    await expect(page.getByText("Survives reload")).toBeVisible();
  });

  test("protected routes redirect when signed out", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
