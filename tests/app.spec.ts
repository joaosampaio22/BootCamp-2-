import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { demoData, emptyData, money } from '../src/domain';
import { STORAGE_KEY } from '../src/storage';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

let browserErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.clock.install({ time: new Date('2026-11-02T15:00:00Z') });
  await page.goto('/');
});
test.afterEach(() =>
  expect(browserErrors, 'nenhum erro JavaScript no navegador').toEqual([]),
);

async function nav(page: Page, name: string) {
  await page
    .getByRole('navigation')
    .getByRole('button', { name, exact: true })
    .click();
}
async function dataPage(page: Page) {
  await page.locator('.data-nav').click();
}
async function demo(page: Page) {
  await page.getByRole('button', { name: 'Experimentar demonstração' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Carregar demonstração' })
    .click();
  await expect(page.getByTestId('monthly-income')).toHaveText(money(665000));
}
async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    'a página cabe na largura da tela',
  ).toBe(true);
}

test('demonstração, criação, edição, exclusão e persistência recalculam o painel', async ({
  page,
}) => {
  await expect(page.getByTestId('monthly-balance')).toHaveText(money(0));
  await demo(page);
  await expect(page.getByTestId('monthly-expense')).toHaveText(money(269340));
  await page
    .getByRole('button', { name: 'Novo lançamento', exact: true })
    .click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição').fill('Lanche do workshop');
  await dialog.getByLabel('Valor (R$)').fill('25,10');
  await dialog.getByLabel('Data', { exact: true }).fill('2026-11-02');
  await dialog.getByRole('button', { name: 'Adicionar lançamento' }).click();
  await expect(page.getByTestId('monthly-expense')).toHaveText(money(271850));
  await page.reload();
  await expect(page.getByTestId('monthly-expense')).toHaveText(money(271850));
  await nav(page, 'Lançamentos');
  await page
    .getByRole('button', { name: 'Editar Lanche do workshop', exact: true })
    .click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Valor (R$)').fill('35,10');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Lanche do workshop' }),
  ).toContainText(money(3510));
  await page
    .getByRole('button', { name: 'Excluir Lanche do workshop', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancelar' })
    .click();
  await expect(
    page.getByText('Lanche do workshop', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Excluir Lanche do workshop', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Excluir lançamento' })
    .click();
  await expect(
    page.getByText('Lanche do workshop', { exact: true }),
  ).toHaveCount(0);
  await nav(page, 'Visão geral');
  await expect(page.getByTestId('monthly-balance')).toHaveText(money(395660));
  await expectNoOverflow(page);
});

test('filtros por mês, tipo e categoria exibem somente os lançamentos esperados', async ({
  page,
}) => {
  await demo(page);
  await nav(page, 'Lançamentos');
  await page.getByLabel('Tipo', { exact: true }).selectOption('income');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByLabel('Categoria', { exact: true }).selectOption('salary');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText(
    'Salário · exemplo fictício',
  );
  await page.getByRole('button', { name: 'Mês anterior' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nenhum lançamento por aqui' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Próximo mês' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expectNoOverflow(page);
});

test('receita pode ser criada, editada e excluída; valor zero é recusado no formulário', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Novo lançamento', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Receita', exact: true }).click();
  await dialog.getByLabel('Descrição').fill('Receita fictícia do workshop');
  await dialog.getByLabel('Valor (R$)').fill('0');
  await dialog.getByRole('button', { name: 'Adicionar lançamento' }).click();
  await expect(dialog.getByRole('alert')).toContainText('maior que zero');
  await dialog.getByLabel('Valor (R$)').fill('100,05');
  await dialog.getByRole('button', { name: 'Adicionar lançamento' }).click();
  await expect(page.getByTestId('monthly-income')).toHaveText(money(10005));
  await page
    .getByRole('button', {
      name: 'Editar Receita fictícia do workshop',
      exact: true,
    })
    .click();
  await dialog.getByLabel('Valor (R$)').fill('200,10');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByTestId('monthly-income')).toHaveText(money(20010));
  await page
    .getByRole('button', {
      name: 'Excluir Receita fictícia do workshop',
      exact: true,
    })
    .click();
  await dialog.getByRole('button', { name: 'Excluir lançamento' }).click();
  await expect(page.getByTestId('monthly-income')).toHaveText(money(0));
});

test('limite mensal mostra atenção, excesso e conquista sem duplicar orçamento', async ({
  page,
}) => {
  await demo(page);
  await nav(page, 'Orçamentos');
  await expect(page.getByText('Atenção ao limite')).toBeVisible();
  await page
    .getByRole('button', { name: 'Editar orçamento de Alimentação' })
    .click();
  await page
    .getByRole('dialog')
    .getByLabel('Limite mensal (R$)')
    .fill('500,00');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Salvar orçamento' })
    .click();
  await expect(page.getByText('R$ 14,50 acima do limite')).toBeVisible();
  await expect(page.locator('.budgets-grid .budget-card')).toHaveCount(3);
  await nav(page, 'Conquistas');
  await expect(page.locator('.achievement-card.unlocked')).toHaveCount(1);
  await expectNoOverflow(page);
});

test('previsão não afeta gastos; confirmar conta uma vez e excluir reabre a conta', async ({
  page,
}) => {
  await demo(page);
  await nav(page, 'Contas recorrentes');
  let row = page
    .locator('.forecast-row')
    .filter({ hasText: 'Internet de casa' })
    .first();
  await row.getByRole('button', { name: /Confirmar pagamento/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar pagamento', exact: true })
    .click();
  await expect(row.getByText('Paga', { exact: true })).toBeVisible();
  await expect(row.getByRole('button')).toHaveCount(0);
  await nav(page, 'Visão geral');
  await expect(page.getByTestId('monthly-expense')).toHaveText(money(281330));
  await nav(page, 'Lançamentos');
  await page
    .getByRole('button', { name: 'Excluir Internet de casa', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('pendente novamente');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Excluir lançamento' })
    .click();
  await nav(page, 'Contas recorrentes');
  row = page
    .locator('.forecast-row')
    .filter({ hasText: 'Internet de casa' })
    .first();
  await expect(
    row.getByRole('button', { name: /Confirmar pagamento/ }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Cadastrar conta', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição').fill('Conta fictícia dia 31');
  await dialog.getByLabel('Valor mensal (R$)').fill('99,90');
  await dialog.getByLabel('Dia do vencimento').fill('31');
  await dialog.getByLabel('A partir de').fill('2027-02');
  await dialog.getByRole('button', { name: 'Cadastrar conta' }).click();
  await page.getByLabel('Mês selecionado').fill('2027-02');
  const feb = page.locator('.forecast-panel').first();
  await expect(
    feb
      .locator('.forecast-row')
      .filter({ hasText: 'Conta fictícia dia 31' })
      .locator('.due-box strong'),
  ).toHaveText('28');
  await expectNoOverflow(page);
});

test('backup exportado é válido; importação inválida e cancelamento preservam os dados', async ({
  page,
}) => {
  await demo(page);
  await dataPage(page);
  const downloadEvent = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Exportar backup', exact: true })
    .click();
  const download = await downloadEvent;
  const path = await download.path();
  const { readFile } = await import('node:fs/promises');
  const backup = JSON.parse(await readFile(path!, 'utf8'));
  expect(backup.transactions).toHaveLength(9);
  expect(backup.version).toBe(1);
  const input = page.getByLabel('Arquivo de backup');
  await input.setInputFiles({
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: /Backup inválido/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).transactions.length,
      STORAGE_KEY,
    ),
  ).toBe(9);
  await input.setInputFiles({
    name: 'vazio.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(emptyData())),
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancelar' })
    .click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).transactions.length,
      STORAGE_KEY,
    ),
  ).toBe(9);
  await input.setInputFiles({
    name: 'vazio.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(emptyData())),
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Restaurar backup' })
    .click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).transactions.length,
      STORAGE_KEY,
    ),
  ).toBe(0);
  await input.setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Restaurar backup' })
    .click();
  await nav(page, 'Visão geral');
  await expect(page.getByTestId('monthly-income')).toHaveText(money(665000));
});

test('revisão semanal e fechamento concedem conquistas; demonstração pede confirmação', async ({
  page,
}) => {
  await demo(page);
  await page.getByRole('button', { name: 'Conferir minha semana' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Conferi os lançamentos' })
    .click();
  await page.getByRole('button', { name: 'Conferir fechamento' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Concluir fechamento' })
    .click();
  await nav(page, 'Conquistas');
  await expect(page.locator('.achievement-card.unlocked')).toHaveCount(3);
  await dataPage(page);
  await page.getByRole('button', { name: 'Carregar demonstração' }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'substitui todos os dados atuais',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancelar' })
    .click();
  await nav(page, 'Conquistas');
  await expect(page.locator('.achievement-card.unlocked')).toHaveCount(3);
});

test('dados locais corrompidos são preservados; recuperação não é substituída por zeros', async ({
  page,
}) => {
  await page.evaluate(
    (key) => localStorage.setItem(key, 'conteudo-incompleto'),
    STORAGE_KEY,
  );
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(
    'conteúdo original foi preservado',
  );
  await page
    .getByRole('button', { name: 'Novo lançamento', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição').fill('Não deve sobrescrever');
  await dialog.getByLabel('Valor (R$)').fill('1,00');
  await dialog.getByRole('button', { name: 'Adicionar lançamento' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText(
    'protegidos para recuperação',
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe('conteudo-incompleto');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
});

test('interface em todas as páginas, teclado e capturas reais da demonstração', async ({
  page,
}, testInfo) => {
  await demo(page);
  await page
    .locator('.toast')
    .getByRole('button', { name: 'Fechar mensagem' })
    .click();
  await expectNoOverflow(page);
  await page.screenshot({
    path: `docs/evidencias/capturas/painel-${testInfo.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  for (const name of [
    'Lançamentos',
    'Orçamentos',
    'Contas recorrentes',
    'Conquistas',
  ]) {
    await nav(page, name);
    await expectNoOverflow(page);
    if (name === 'Contas recorrentes')
      await page.screenshot({
        path: `docs/evidencias/capturas/recorrencias-${testInfo.project.name}.png`,
        fullPage: true,
        animations: 'disabled',
      });
  }
  await dataPage(page);
  await expectNoOverflow(page);
  await nav(page, 'Lançamentos');
  await page
    .getByRole('button', { name: 'Novo lançamento', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByLabel('Descrição')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      STORAGE_KEY,
    ),
  ).toEqual(demoData('2026-11'));
});

test('acessibilidade automatizada WCAG A e AA em todas as páginas', async ({
  page,
}, testInfo) => {
  const results: {
    page: string;
    violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];
  }[] = [];
  const scan = async (name: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    results.push({ page: name, violations: result.violations });
  };
  await scan('Visão geral vazia');
  await demo(page);
  for (const name of [
    'Visão geral',
    'Lançamentos',
    'Orçamentos',
    'Contas recorrentes',
    'Conquistas',
    'Dados e backup',
  ]) {
    if (name === 'Dados e backup') await dataPage(page);
    else await nav(page, name);
    await scan(name);
  }
  await nav(page, 'Lançamentos');
  await page
    .getByRole('button', { name: 'Novo lançamento', exact: true })
    .click();
  await scan('Modal de lançamento');
  await page.keyboard.press('Escape');
  await nav(page, 'Orçamentos');
  await page
    .getByRole('button', { name: 'Definir orçamento', exact: true })
    .click();
  await scan('Modal de orçamento');
  await page.keyboard.press('Escape');
  await nav(page, 'Contas recorrentes');
  await page
    .getByRole('button', { name: 'Cadastrar conta', exact: true })
    .click();
  await scan('Modal de recorrência');
  await page.keyboard.press('Escape');
  await nav(page, 'Conquistas');
  await page
    .getByRole('button', { name: 'Conferir semana', exact: true })
    .click();
  await scan('Modal de conferência semanal');
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Conferir fechamento', exact: true })
    .click();
  await scan('Modal de fechamento');
  await page.keyboard.press('Escape');
  await writeFile(
    `docs/evidencias/testes/axe-${testInfo.project.name}.json`,
    JSON.stringify(results, null, 2),
  );
  expect(
    results.flatMap((r) =>
      r.violations.map((v) => ({
        page: r.page,
        rule: v.id,
        elements: v.nodes.map((n) => n.target),
      })),
    ),
  ).toEqual([]);
});
