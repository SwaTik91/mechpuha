import { expect, test } from "@playwright/test";

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Почта").fill(email);
  await page.getByLabel("Пароль").fill("password12");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await page.waitForURL(/\/(create|family\/)/);
}

async function createRootFamily(
  page: import("@playwright/test").Page,
  name: string,
  surname: string,
  birthPlace: string
) {
  if (page.url().includes("/create")) {
    await page.getByLabel("Имя").fill(name);
    await page.getByLabel("Фамилия").fill(surname);
    await page.getByLabel("Место рождения").fill(birthPlace);
    await page.getByRole("button", { name: "Открыть книгу" }).click();
    await page.waitForURL(/\/family\//);
  }
}

test("open register, build two generations, open poster without login", async ({ browser }) => {
  const context = await browser.newContext();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage();

  await register(page, "child@example.com");
  await createRootFamily(page, "Давид", "Абрамовы", "Москва");
  await expect(page.getByText("Семейная книга")).toBeVisible();

  await page.getByRole("button", { name: "отец" }).click();
  const fatherForm = page.getByRole("dialog");
  await expect(fatherForm).toBeVisible();
  await fatherForm.getByLabel("Имя").fill("Рахамим");
  await fatherForm.getByLabel("Место рождения").fill("Дербент");
  await fatherForm.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("button", { name: /Рахамим/ })).toBeVisible();

  await page.getByRole("button", { name: "мать" }).click();
  const motherForm = page.getByRole("dialog");
  await expect(motherForm).toBeVisible();
  await motherForm.getByLabel("Имя").fill("Сара");
  await motherForm.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("button", { name: /Сара/ })).toBeVisible();
  await expect(page.getByTestId("tree-link-label")).toHaveText(/родители/i);

  await page.getByRole("button", { name: "Ссылка для старшего" }).click();
  const url = await page.getByTestId("poster-url").innerText();

  const guest = await browser.newContext();
  const poster = await guest.newPage();
  await poster.goto(url);
  await expect(poster.getByText("Давид")).toBeVisible();
  await expect(poster.getByText("Рахамим")).toBeVisible();
  await expect(poster.getByText("Сара")).toBeVisible();
  await expect(poster.getByTestId("tree-link-label")).toHaveText(/родители/i);
  await expect(poster.getByText("Сохранить")).toHaveCount(0);
});

test("stranger cannot open another user family", async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  await register(pageA, "owner@example.com");
  await createRootFamily(pageA, "Давид", "Абрамовы", "Москва");
  const familyId = pageA.url().split("/family/")[1];

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await register(pageB, "stranger@example.com");
  await pageB.goto(`/family/${familyId}`);

  await expect(pageB.getByText("Семейная книга")).toHaveCount(0);
  await expect(pageB.getByRole("button", { name: "Давид" })).toHaveCount(0);
});
