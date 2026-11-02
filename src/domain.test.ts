import { describe, expect, it } from 'vitest';
import {
  addMonths,
  budgetUsage,
  categorySpending,
  closeMonth,
  confirmPayment,
  demoData,
  dueDate,
  emptyData,
  forecasts,
  isDate,
  moneyInput,
  parseBackup,
  parseMoney,
  reviewWeek,
  saveBudget,
  saveTransaction,
  totals,
  validateData,
  weekStart,
} from './domain';
import type { Budget, FinanceData, Recurrence, Transaction } from './domain';
import { loadData, STORAGE_KEY, writeStorage } from './storage';

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  date: '2026-11-02',
  kind: 'expense',
  amountCents: 10,
  description: 'Despesa de teste',
  categoryId: 'food',
  ...overrides,
});
const recurring = (overrides: Partial<Recurrence> = {}): Recurrence => ({
  id: 'r1',
  description: 'Internet fictícia',
  amountCents: 9990,
  categoryId: 'home',
  dueDay: 31,
  startMonth: '2026-01',
  active: true,
  ...overrides,
});
const withAccount = (): FinanceData => ({
  ...emptyData(),
  recurrences: [recurring()],
});
const budget: Budget = {
  id: 'b1',
  month: '2026-11',
  categoryId: 'food',
  limitCents: 10000,
};

describe('valores monetários em centavos', () => {
  it.each([
    ['0,10', 10],
    ['0.20', 20],
    ['1.234,56', 123456],
    ['1234,5', 123450],
    ['R$ 15,99', 1599],
    ['1000000', 100000000],
  ])('converte %s sem multiplicar frações binárias', (input, expected) =>
    expect(parseMoney(input)).toBe(expected),
  );
  it.each([
    '0',
    '-5',
    '1,234',
    '1.000',
    '1e5',
    'NaN',
    'Infinity',
    '1,00,00',
    '1.23,45',
    '1000000,01',
    '',
    ' ',
    '2.555555',
  ])('recusa valor inválido: %s', (value) =>
    expect(() => parseMoney(value)).toThrow(),
  );
  it('soma 10 e 20 centavos exatamente e preserva ida e volta', () => {
    expect(
      totals(
        [transaction(), transaction({ id: 't2', amountCents: 20 })],
        '2026-11',
      ).expense,
    ).toBe(30);
    expect(parseMoney(moneyInput(123456))).toBe(123456);
  });
});

describe('totais e filtros mensais', () => {
  it('isola mês, ano, tipo e resultado, incluindo saldo negativo', () => {
    const items = [
      transaction({ kind: 'income', categoryId: 'salary', amountCents: 500 }),
      transaction({ id: 't2', amountCents: 800 }),
      transaction({ id: 't3', date: '2025-11-02', amountCents: 99999 }),
      transaction({ id: 't4', date: '2026-12-02', amountCents: 88888 }),
    ];
    expect(totals(items, '2026-11')).toEqual({
      income: 500,
      expense: 800,
      balance: -300,
      count: 2,
    });
    expect(
      categorySpending(items, '2026-11').map((i) => [i.category.id, i.amount]),
    ).toEqual([['food', 800]]);
  });
  it('retorna zeros em um mês vazio', () =>
    expect(totals([], '2026-02')).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
      count: 0,
    }));
  it('recalcula após editar e excluir', () => {
    const original = saveTransaction(
      emptyData(),
      transaction({ amountCents: 10000 }),
    );
    const edited = saveTransaction(
      original,
      transaction({ amountCents: 5000, date: '2026-12-02' }),
    );
    expect(totals(edited.transactions, '2026-11').expense).toBe(0);
    expect(totals(edited.transactions, '2026-12').expense).toBe(5000);
    expect(
      totals(
        edited.transactions.filter((t) => t.id !== 't1'),
        '2026-12',
      ).expense,
    ).toBe(0);
  });
});

describe('limites definidos pelo usuário', () => {
  it.each([
    [0, 'ok'],
    [7999, 'ok'],
    [8000, 'near'],
    [10000, 'near'],
    [10001, 'exceeded'],
  ] as const)('sinaliza corretamente %i centavos', (spent, status) => {
    expect(
      budgetUsage(budget, spent ? [transaction({ amountCents: spent })] : [])
        .status,
    ).toBe(status);
  });
  it('não usa a porcentagem arredondada para decidir o alerta', () => {
    const usage = budgetUsage(budget, [transaction({ amountCents: 7999 })]);
    expect(usage.percent).toBe(80);
    expect(usage.status).toBe('ok');
  });
  it('ignora receitas, outras categorias e outros meses', () => {
    const list = [
      transaction({ amountCents: 2500 }),
      transaction({ id: 'other', amountCents: 9000, categoryId: 'home' }),
      transaction({ id: 'next', amountCents: 9000, date: '2026-12-01' }),
      transaction({
        id: 'income',
        kind: 'income',
        categoryId: 'salary',
        amountCents: 9000,
      }),
    ];
    expect(budgetUsage(budget, list).spent).toBe(2500);
  });
  it('atualiza o mesmo limite e não duplica conquistas', () => {
    let data = saveBudget(emptyData(), budget);
    data = saveBudget(data, { ...budget, id: 'new', limitCents: 15000 });
    expect(data.budgets).toHaveLength(1);
    expect(data.budgets[0].limitCents).toBe(15000);
    expect(data.achievements).toEqual(['first-budget']);
  });
});

describe('calendário e recorrências mensais', () => {
  it.each([
    ['2026-02', 31, '2026-02-28'],
    ['2024-02', 31, '2024-02-29'],
    ['2026-04', 31, '2026-04-30'],
    ['2026-01', 31, '2026-01-31'],
  ])('ajusta vencimento em %s', (month, day, expected) =>
    expect(dueDate(month, day)).toBe(expected),
  );
  it('valida datas sem converter dia inválido silenciosamente', () => {
    expect(isDate('2026-02-29')).toBe(false);
    expect(isDate('2024-02-29')).toBe(true);
    expect(isDate('2026-13-01')).toBe(false);
    expect(isDate('2026-11-00')).toBe(false);
  });
  it('avança o ano e cria exatamente três meses', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(forecasts(withAccount(), '2026-12').map((i) => i.date)).toEqual([
      '2026-12-31',
      '2027-01-31',
      '2027-02-28',
    ]);
  });
  it('respeita início e pausa, sem registrar despesas previstas', () => {
    const data = {
      ...withAccount(),
      recurrences: [recurring({ startMonth: '2026-12' })],
    };
    expect(forecasts(data, '2026-11').map((i) => i.month)).toEqual([
      '2026-12',
      '2027-01',
    ]);
    expect(data.transactions).toHaveLength(0);
    expect(totals(data.transactions, '2026-12').expense).toBe(0);
    expect(
      forecasts(
        { ...data, recurrences: [recurring({ active: false })] },
        '2026-11',
      ),
    ).toEqual([]);
  });
  it('confirma uma única despesa por conta e mês; outro mês é independente', () => {
    const paid = confirmPayment(withAccount(), 'r1', '2026-02');
    expect(paid.transactions).toHaveLength(1);
    expect(paid.transactions[0].date).toBe('2026-02-28');
    expect(totals(paid.transactions, '2026-02').expense).toBe(9990);
    expect(forecasts(paid, '2026-02')[0].payment?.id).toBe(
      paid.transactions[0].id,
    );
    expect(() => confirmPayment(paid, 'r1', '2026-02')).toThrow('já foi paga');
    expect(confirmPayment(paid, 'r1', '2026-03').transactions).toHaveLength(2);
  });
  it('não paga antes do início, conta pausada ou inexistente', () => {
    expect(() => confirmPayment(withAccount(), 'missing', '2026-11')).toThrow();
    expect(() => confirmPayment(withAccount(), 'r1', '2025-12')).toThrow();
    expect(() =>
      confirmPayment(
        { ...withAccount(), recurrences: [recurring({ active: false })] },
        'r1',
        '2026-11',
      ),
    ).toThrow();
  });
  it('preserva pagamentos de uma conta pausada', () => {
    const paid = confirmPayment(withAccount(), 'r1', '2026-11');
    const paused = { ...paid, recurrences: [recurring({ active: false })] };
    expect(forecasts(paused, '2026-11')).toHaveLength(1);
    expect(totals(paused.transactions, '2026-11').expense).toBe(9990);
  });
  it('editar pagamento mantém vínculo; excluir reabre a previsão', () => {
    const paid = confirmPayment(withAccount(), 'r1', '2026-11');
    const edited = saveTransaction(paid, {
      ...paid.transactions[0],
      amountCents: 10500,
      date: '2026-11-15',
    });
    expect(totals(edited.transactions, '2026-11').expense).toBe(10500);
    expect(() =>
      saveTransaction(paid, { ...paid.transactions[0], date: '2026-12-01' }),
    ).toThrow();
    expect(() =>
      saveTransaction(paid, {
        ...paid.transactions[0],
        recurrenceId: undefined,
        occurrenceMonth: undefined,
      }),
    ).toThrow();
    const deleted = { ...edited, transactions: [] };
    expect(forecasts(deleted, '2026-11')[0].payment).toBeUndefined();
    expect(confirmPayment(deleted, 'r1', '2026-11').transactions).toHaveLength(
      1,
    );
  });
});

describe('backups e armazenamento local', () => {
  it('exporta e restaura o conjunto fictício integralmente', () => {
    const data = demoData('2026-11');
    expect(parseBackup(JSON.stringify(data))).toEqual(data);
    expect(totals(data.transactions, '2026-11')).toEqual({
      income: 665000,
      expense: 269340,
      balance: 395660,
      count: 9,
    });
  });
  it.each([
    '{',
    '{}',
    'null',
    '{"version":2}',
    '{"version":1,"transactions":[]}',
  ])('recusa JSON ou estrutura inválida: %s', (raw) =>
    expect(() => parseBackup(raw)).toThrow(),
  );
  it('recusa valor não inteiro, categoria incompatível e data impossível', () => {
    const invalidValues: Partial<Transaction>[] = [
      { amountCents: 1.5 },
      { categoryId: 'salary' },
      { date: '2026-02-30' },
      { amountCents: -10 },
    ];
    for (const invalid of invalidValues)
      expect(() =>
        validateData({ ...emptyData(), transactions: [transaction(invalid)] }),
      ).toThrow();
  });
  it('recusa IDs, orçamentos e pagamentos duplicados ou órfãos', () => {
    expect(() =>
      validateData({
        ...emptyData(),
        transactions: [transaction(), transaction()],
      }),
    ).toThrow();
    expect(() =>
      validateData({
        ...emptyData(),
        budgets: [budget, { ...budget, id: 'b2' }],
      }),
    ).toThrow();
    const paid = confirmPayment(withAccount(), 'r1', '2026-11');
    expect(() =>
      validateData({
        ...paid,
        transactions: [
          ...paid.transactions,
          { ...paid.transactions[0], id: 't2' },
        ],
      }),
    ).toThrow();
    expect(() => validateData({ ...paid, recurrences: [] })).toThrow();
  });
  it('recusa arquivos excessivos e campos desconhecidos', () => {
    expect(() => parseBackup(' '.repeat(5 * 1024 * 1024 + 1))).toThrow('5 MB');
    expect(() => validateData({ ...emptyData(), unexpected: true })).toThrow();
  });
  it('recupera coleções locais ausentes, sem aceitar registros corrompidos', () => {
    const missing = loadData('{"version":1}');
    expect(missing.locked).toBe(false);
    expect(missing.warning).toContain('incompletos');
    expect(missing.data).toEqual(emptyData());
    const corrupt = loadData('{"version":1,"transactions":[{"id":"broken"}]}');
    expect(corrupt.locked).toBe(true);
    expect(corrupt.warning).toContain('preservado');
  });
  it('inicia vazio e protege conteúdo ilegível', () => {
    expect(loadData(null).data).toEqual(emptyData());
    expect(loadData('invalid').locked).toBe(true);
  });
  it('só grava dados válidos e comunica falha de armazenamento', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        setItem: (key: string, text: string) => {
          expect(key).toBe(STORAGE_KEY);
          expect(parseBackup(text)).toEqual(emptyData());
          throw new DOMException('Quota', 'QuotaExceededError');
        },
      },
    });
    try {
      expect(() => writeStorage(emptyData())).toThrow('cheio ou bloqueado');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: original,
      });
    }
  });
});

describe('conquistas e conferências sem incentivo a gastos', () => {
  it('não concede conquistas por repetir lançamentos', () => {
    const data = saveTransaction(emptyData(), transaction());
    expect(data.achievements).toEqual([]);
  });
  it('registra a semana uma vez, incluindo domingo e virada de ano', () => {
    expect(weekStart('2026-11-08')).toBe('2026-11-02');
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
    const twice = reviewWeek(
      reviewWeek(emptyData(), '2026-11-02'),
      '2026-11-08',
    );
    expect(twice.achievements).toEqual(['weekly-review']);
    expect(twice.reviewedWeeks).toHaveLength(1);
  });
  it('fecha mês atual ou passado, sem bloquear lançamentos ou duplicar a conquista', () => {
    const closed = closeMonth(
      closeMonth(emptyData(), '2026-11', '2026-11'),
      '2026-11',
      '2026-11',
    );
    expect(closed.closedMonths).toEqual(['2026-11']);
    expect(closed.achievements).toEqual(['first-close']);
    expect(saveTransaction(closed, transaction()).transactions).toHaveLength(1);
    expect(() => closeMonth(closed, '2026-12', '2026-11')).toThrow();
  });
});
