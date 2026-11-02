import { z } from 'zod';

z.config(z.locales.pt());

export const categories = [
  {
    id: 'salary',
    name: 'Salário',
    kind: 'income',
    color: '#2d806b',
    icon: 'wallet',
  },
  {
    id: 'freelance',
    name: 'Renda extra',
    kind: 'income',
    color: '#5b8dba',
    icon: 'briefcase',
  },
  {
    id: 'other-income',
    name: 'Outras receitas',
    kind: 'income',
    color: '#8c9d6e',
    icon: 'plus',
  },
  {
    id: 'home',
    name: 'Moradia',
    kind: 'expense',
    color: '#357d6b',
    icon: 'home',
  },
  {
    id: 'food',
    name: 'Alimentação',
    kind: 'expense',
    color: '#e6ae70',
    icon: 'food',
  },
  {
    id: 'transport',
    name: 'Transporte',
    kind: 'expense',
    color: '#789bb4',
    icon: 'car',
  },
  {
    id: 'health',
    name: 'Saúde',
    kind: 'expense',
    color: '#b38eaa',
    icon: 'heart',
  },
  {
    id: 'education',
    name: 'Educação',
    kind: 'expense',
    color: '#8ca882',
    icon: 'book',
  },
  {
    id: 'leisure',
    name: 'Lazer',
    kind: 'expense',
    color: '#cb8d73',
    icon: 'coffee',
  },
  {
    id: 'other',
    name: 'Outras despesas',
    kind: 'expense',
    color: '#9b9fa3',
    icon: 'more',
  },
] as const;
export type Kind = 'income' | 'expense';
export type Category = (typeof categories)[number];
export const expenseCategories = categories.filter((c) => c.kind === 'expense');
export const categoryById = (id: string) =>
  categories.find((c) => c.id === id)!;
export const MAX_CENTS = 100_000_000;

export function isMonth(value: string): boolean {
  return /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value);
}
export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isMonth(value.slice(0, 7)))
    return false;
  const [y, m, d] = value.split('-').map(Number);
  return d >= 1 && d <= new Date(y, m, 0).getDate();
}
export function todayLocal(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function addMonths(month: string, offset: number): string {
  if (!isMonth(month)) throw new Error('Mês inválido.');
  const [y, m] = month.split('-').map(Number);
  const next = new Date(y, m - 1 + offset, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}
export function dueDate(month: string, day: number): string {
  if (!isMonth(month) || !Number.isInteger(day) || day < 1 || day > 31)
    throw new Error('Vencimento inválido.');
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(Math.min(day, new Date(y, m, 0).getDate())).padStart(2, '0')}`;
}
export const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
export const monthLabel = (month: string, short = false) =>
  new Intl.DateTimeFormat('pt-BR', {
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(new Date(`${month}-15T12:00:00`));
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );

/** Convert decimal text to integer cents, without floating point multiplication. */
export function parseMoney(raw: string): number {
  let value = raw.trim().replace(/^R\$\s*/, '');
  if (value.includes(',')) {
    if (!/^(\d+|\d{1,3}(\.\d{3})+),\d{1,2}$/.test(value))
      throw new Error('Use um valor como 120,50, com até duas casas decimais.');
    value = value.replaceAll('.', '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error('Use um valor como 120,50, com até duas casas decimais.');
  const [units, fraction = ''] = value.split('.');
  const cents = Number(units) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS)
    throw new Error('O valor deve ser maior que zero e até R$ 1.000.000,00.');
  return cents;
}
export const moneyInput = (cents: number) =>
  `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
export const newId = () => crypto.randomUUID();

const idSchema = z.string().regex(/^[\w:-]{1,80}$/);
const monthSchema = z.string().refine(isMonth, 'Mês inválido.');
const dateSchema = z.string().refine(isDate, 'Data inválida.');
const centsSchema = z.number().int().min(1).max(MAX_CENTS);
const descriptionSchema = z.string().trim().min(1).max(100);
const categorySchema = z.enum(categories.map((c) => c.id));
export const transactionSchema = z
  .strictObject({
    id: idSchema,
    kind: z.enum(['income', 'expense']),
    date: dateSchema,
    description: descriptionSchema,
    amountCents: centsSchema,
    categoryId: categorySchema,
    recurrenceId: idSchema.optional(),
    occurrenceMonth: monthSchema.optional(),
  })
  .superRefine((t, ctx) => {
    if (categoryById(t.categoryId).kind !== t.kind)
      ctx.addIssue({
        code: 'custom',
        message: 'Categoria incompatível com o tipo.',
      });
    if (Boolean(t.recurrenceId) !== Boolean(t.occurrenceMonth))
      ctx.addIssue({
        code: 'custom',
        message: 'Vínculo de pagamento incompleto.',
      });
    if (
      t.recurrenceId &&
      (t.kind !== 'expense' || t.date.slice(0, 7) !== t.occurrenceMonth)
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Pagamento deve ser uma despesa no mês da conta.',
      });
  });
export const recurrenceSchema = z.strictObject({
  id: idSchema,
  description: descriptionSchema,
  amountCents: centsSchema,
  categoryId: categorySchema.refine(
    (id) => categoryById(id).kind === 'expense',
  ),
  dueDay: z.number().int().min(1).max(31),
  startMonth: monthSchema,
  active: z.boolean(),
});
export const budgetSchema = z.strictObject({
  id: idSchema,
  month: monthSchema,
  categoryId: categorySchema.refine(
    (id) => categoryById(id).kind === 'expense',
  ),
  limitCents: centsSchema,
});
export const achievementIds = [
  'first-budget',
  'weekly-review',
  'first-close',
] as const;
export const dataSchema = z
  .strictObject({
    version: z.literal(1),
    transactions: z.array(transactionSchema).max(10_000),
    budgets: z.array(budgetSchema).max(10_000),
    recurrences: z.array(recurrenceSchema).max(1_000),
    achievements: z.array(z.enum(achievementIds)).max(3),
    reviewedWeeks: z.array(dateSchema).max(10_000),
    closedMonths: z.array(monthSchema).max(3_600),
  })
  .superRefine((data, ctx) => {
    const unique = (values: string[], label: string) => {
      if (new Set(values).size !== values.length)
        ctx.addIssue({ code: 'custom', message: `${label} duplicados.` });
    };
    unique(
      data.transactions.map((t) => t.id),
      'Lançamentos',
    );
    unique(
      data.recurrences.map((r) => r.id),
      'Contas',
    );
    unique(
      data.budgets.map((b) => b.id),
      'Orçamentos',
    );
    unique(
      data.budgets.map((b) => `${b.month}:${b.categoryId}`),
      'Limites por categoria e mês',
    );
    unique(data.achievements, 'Conquistas');
    unique(data.reviewedWeeks, 'Conferências');
    unique(data.closedMonths, 'Fechamentos');
    const paid = data.transactions.filter((t) => t.recurrenceId);
    unique(
      paid.map((t) => `${t.recurrenceId}:${t.occurrenceMonth}`),
      'Pagamentos de uma mesma conta no mês',
    );
    paid.forEach((t) => {
      const r = data.recurrences.find((r) => r.id === t.recurrenceId);
      if (!r || t.occurrenceMonth! < r.startMonth)
        ctx.addIssue({
          code: 'custom',
          message: 'Pagamento sem conta recorrente válida.',
        });
    });
  });
export type Transaction = z.infer<typeof transactionSchema>;
export type Recurrence = z.infer<typeof recurrenceSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type FinanceData = z.infer<typeof dataSchema>;
export type AchievementId = (typeof achievementIds)[number];
export const emptyData = (): FinanceData => ({
  version: 1,
  transactions: [],
  budgets: [],
  recurrences: [],
  achievements: [],
  reviewedWeeks: [],
  closedMonths: [],
});

export function validateData(value: unknown): FinanceData {
  const result = dataSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      `Backup inválido: ${result.error.issues[0]?.message ?? 'estrutura não reconhecida'}. Nenhum dado foi substituído.`,
    );
  return result.data;
}
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export function parseBackup(text: string): FinanceData {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error('O backup excede 5 MB.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      'O arquivo não contém um JSON válido. Nenhum dado foi substituído.',
    );
  }
  return validateData(value);
}
export function totals(transactions: Transaction[], month: string) {
  const monthly = transactions.filter((t) => t.date.startsWith(`${month}-`));
  const income = monthly
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amountCents, 0);
  const expense = monthly
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amountCents, 0);
  return { income, expense, balance: income - expense, count: monthly.length };
}
export function categorySpending(transactions: Transaction[], month: string) {
  return expenseCategories
    .map((category) => ({
      category,
      amount: transactions
        .filter(
          (t) =>
            t.kind === 'expense' &&
            t.date.startsWith(`${month}-`) &&
            t.categoryId === category.id,
        )
        .reduce((sum, t) => sum + t.amountCents, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}
export function budgetUsage(budget: Budget, transactions: Transaction[]) {
  const spent = transactions
    .filter(
      (t) =>
        t.kind === 'expense' &&
        t.date.startsWith(`${budget.month}-`) &&
        t.categoryId === budget.categoryId,
    )
    .reduce((sum, t) => sum + t.amountCents, 0);
  const percent = Math.round((spent / budget.limitCents) * 100);
  // Integer comparisons keep the exact 80% boundary independent of display rounding.
  const status =
    spent > budget.limitCents
      ? 'exceeded'
      : spent * 100 >= budget.limitCents * 80
        ? 'near'
        : 'ok';
  return { spent, percent, status } as const;
}
export type Forecast = {
  recurrence: Recurrence;
  month: string;
  date: string;
  payment?: Transaction;
};
export function forecasts(
  data: FinanceData,
  fromMonth: string,
  count = 3,
): Forecast[] {
  return Array.from({ length: count }, (_, i) => addMonths(fromMonth, i))
    .flatMap((month) =>
      data.recurrences
        .filter(
          (r) =>
            r.startMonth <= month &&
            (r.active ||
              data.transactions.some(
                (t) => t.recurrenceId === r.id && t.occurrenceMonth === month,
              )),
        )
        .map((recurrence) => ({
          recurrence,
          month,
          date: dueDate(month, recurrence.dueDay),
          payment: data.transactions.find(
            (t) =>
              t.recurrenceId === recurrence.id && t.occurrenceMonth === month,
          ),
        })),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.recurrence.description.localeCompare(b.recurrence.description),
    );
}
export function confirmPayment(
  data: FinanceData,
  recurrenceId: string,
  month: string,
): FinanceData {
  const r = data.recurrences.find((r) => r.id === recurrenceId);
  if (!r || !r.active || month < r.startMonth || !isMonth(month))
    throw new Error('Essa previsão não está disponível.');
  if (
    data.transactions.some(
      (t) => t.recurrenceId === recurrenceId && t.occurrenceMonth === month,
    )
  )
    throw new Error('Essa conta já foi paga neste mês.');
  const payment: Transaction = {
    id: newId(),
    kind: 'expense',
    date: dueDate(month, r.dueDay),
    description: r.description,
    amountCents: r.amountCents,
    categoryId: r.categoryId,
    recurrenceId,
    occurrenceMonth: month,
  };
  return validateData({
    ...data,
    transactions: [...data.transactions, payment],
  });
}
export function saveTransaction(
  data: FinanceData,
  value: Transaction,
): FinanceData {
  const transaction = transactionSchema.parse(value);
  const original = data.transactions.find((t) => t.id === value.id);
  if (
    original &&
    (original.recurrenceId !== value.recurrenceId ||
      original.occurrenceMonth !== value.occurrenceMonth)
  )
    throw new Error('O vínculo com a conta recorrente deve ser preservado.');
  return validateData({
    ...data,
    transactions: [
      ...data.transactions.filter((t) => t.id !== transaction.id),
      transaction,
    ],
  });
}
export function saveBudget(data: FinanceData, budget: Budget): FinanceData {
  return validateData({
    ...data,
    budgets: [
      ...data.budgets.filter(
        (b) =>
          b.id !== budget.id &&
          !(b.month === budget.month && b.categoryId === budget.categoryId),
      ),
      budget,
    ],
    achievements: [...new Set([...data.achievements, 'first-budget' as const])],
  });
}
export function unlock(data: FinanceData, id: AchievementId): FinanceData {
  return { ...data, achievements: [...new Set([...data.achievements, id])] };
}
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return todayLocal(d);
}
export function reviewWeek(data: FinanceData, today: string): FinanceData {
  return unlock(
    {
      ...data,
      reviewedWeeks: [...new Set([...data.reviewedWeeks, weekStart(today)])],
    },
    'weekly-review',
  );
}
export function closeMonth(
  data: FinanceData,
  month: string,
  currentMonth: string,
): FinanceData {
  if (!isMonth(month) || month > currentMonth)
    throw new Error(
      'Escolha o mês atual ou um mês anterior para conferir o fechamento.',
    );
  return unlock(
    { ...data, closedMonths: [...new Set([...data.closedMonths, month])] },
    'first-close',
  );
}

/** Entirely fictional, anchored to the selected month for a repeatable presentation. */
export function demoData(month: string): FinanceData {
  const tx = (
    id: string,
    day: number,
    kind: Kind,
    description: string,
    amountCents: number,
    categoryId: Transaction['categoryId'],
  ): Transaction => ({
    id,
    date: dueDate(month, day),
    kind,
    description,
    amountCents,
    categoryId,
  });
  return validateData({
    ...emptyData(),
    transactions: [
      tx(
        'demo-salary',
        5,
        'income',
        'Salário · exemplo fictício',
        580000,
        'salary',
      ),
      tx(
        'demo-extra',
        12,
        'income',
        'Projeto de design · fictício',
        85000,
        'freelance',
      ),
      {
        ...tx(
          'demo-rent',
          5,
          'expense',
          'Aluguel · exemplo fictício',
          165000,
          'home',
        ),
        recurrenceId: 'demo-rent-account',
        occurrenceMonth: month,
      },
      tx('demo-market', 8, 'expense', 'Compras no mercado', 38650, 'food'),
      tx('demo-lunch', 14, 'expense', 'Almoço de domingo', 12800, 'food'),
      tx(
        'demo-transport',
        10,
        'expense',
        'Passe de transporte',
        22000,
        'transport',
      ),
      tx(
        'demo-course',
        15,
        'expense',
        'Curso de fotografia',
        15900,
        'education',
      ),
      tx('demo-coffee', 18, 'expense', 'Café com amigos', 6500, 'leisure'),
      tx('demo-health', 20, 'expense', 'Farmácia', 8490, 'health'),
    ],
    budgets: [
      { id: 'demo-food-budget', month, categoryId: 'food', limitCents: 60000 },
      {
        id: 'demo-transport-budget',
        month,
        categoryId: 'transport',
        limitCents: 35000,
      },
      {
        id: 'demo-leisure-budget',
        month,
        categoryId: 'leisure',
        limitCents: 25000,
      },
    ],
    recurrences: [
      {
        id: 'demo-rent-account',
        description: 'Aluguel · exemplo fictício',
        amountCents: 165000,
        categoryId: 'home',
        dueDay: 5,
        startMonth: month,
        active: true,
      },
      {
        id: 'demo-internet',
        description: 'Internet de casa',
        amountCents: 11990,
        categoryId: 'home',
        dueDay: 22,
        startMonth: month,
        active: true,
      },
      {
        id: 'demo-streaming',
        description: 'Assinatura de filmes',
        amountCents: 2990,
        categoryId: 'leisure',
        dueDay: 28,
        startMonth: month,
        active: true,
      },
    ],
    achievements: ['first-budget'],
  });
}
