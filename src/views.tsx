import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Download,
  Flag,
  FolderHeart,
  Leaf,
  LockKeyhole,
  Pencil,
  PiggyBank,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  Wallet,
} from 'lucide-react';
import {
  budgetUsage,
  categories,
  categoryById,
  categorySpending,
  dateLabel,
  forecasts,
  money,
  monthLabel,
  parseBackup,
  totals,
  MAX_BACKUP_BYTES,
} from './domain';
import type {
  Budget,
  FinanceData,
  Forecast,
  Recurrence,
  Transaction,
} from './domain';
import { AddButton } from './forms';
import { CategoryIcon, Empty } from './ui';

export type View =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'recurrences'
  | 'achievements'
  | 'data';
type TransactionActions = {
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
};
export function TransactionList({
  items,
  onEdit,
  onDelete,
  compact = false,
}: TransactionActions & { items: Transaction[]; compact?: boolean }) {
  if (!items.length)
    return (
      <Empty title="Nenhum lançamento por aqui">
        Adicione uma receita ou despesa para começar a enxergar seu mês.
      </Empty>
    );
  return (
    <div className="transaction-table">
      <table>
        <thead>
          <tr>
            <th>Lançamento</th>
            {!compact && <th className="category-column">Categoria</th>}
            <th className="date-column">Data</th>
            <th className="amount-column">Valor</th>
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="transaction-description">
                  <CategoryIcon category={categoryById(t.categoryId)} />
                  <div>
                    <strong>{t.description}</strong>
                    <span>
                      {compact
                        ? categoryById(t.categoryId).name
                        : t.kind === 'income'
                          ? 'Receita'
                          : 'Despesa'}
                      {t.recurrenceId && ' · Conta recorrente'}
                    </span>
                  </div>
                </div>
              </td>
              {!compact && (
                <td className="category-column">
                  <span className="category-tag">
                    {categoryById(t.categoryId).name}
                  </span>
                </td>
              )}
              <td className="date-column">{dateLabel(t.date)}</td>
              <td
                className={`amount-column ${t.kind === 'income' ? 'positive' : ''}`}
              >
                {t.kind === 'income' ? '+' : '−'} {money(t.amountCents)}
                <small className="mobile-date">{dateLabel(t.date)}</small>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Editar ${t.description}`}
                    onClick={() => onEdit(t)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger-hover"
                    aria-label={`Excluir ${t.description}`}
                    onClick={() => onDelete(t)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BudgetCard({
  budget,
  data,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  data: FinanceData;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const usage = budgetUsage(budget, data.transactions);
  const category = categoryById(budget.categoryId);
  return (
    <article className={`budget-card ${usage.status}`}>
      <div className="budget-title">
        <div className="inline">
          <CategoryIcon category={category} small />
          <strong>{category.name}</strong>
        </div>
        <div className="row-actions">
          <button
            className="icon-button"
            aria-label={`Editar orçamento de ${category.name}`}
            onClick={onEdit}
          >
            <Pencil size={15} />
          </button>
          {onDelete && (
            <button
              className="icon-button danger-hover"
              aria-label={`Excluir orçamento de ${category.name}`}
              onClick={onDelete}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="budget-values">
        <strong>{money(usage.spent)}</strong>
        <span>de {money(budget.limitCents)}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`Orçamento de ${category.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, usage.percent)}
        aria-valuetext={`${usage.percent}% do limite usado`}
      >
        <span style={{ width: `${Math.min(100, usage.percent)}%` }} />
      </div>
      <div className="budget-status">
        <span>
          {usage.status === 'exceeded'
            ? `${money(usage.spent - budget.limitCents)} acima do limite`
            : usage.status === 'near'
              ? 'Atenção ao limite'
              : `${money(budget.limitCents - usage.spent)} disponíveis`}
        </span>
        <strong>{usage.percent}%</strong>
      </div>
    </article>
  );
}

export function ForecastRow({
  item,
  onPay,
}: {
  item: Forecast;
  onPay: (item: Forecast) => void;
}) {
  return (
    <div className={`forecast-row ${item.payment ? 'paid' : ''}`}>
      <span className="due-box">
        <strong>{item.date.slice(8)}</strong>
        <small>
          {monthLabel(item.month, true).split(' ')[0].replace('.', '')}
        </small>
      </span>
      <div className="forecast-description">
        <strong>{item.recurrence.description}</strong>
        <span>
          {categoryById(item.recurrence.categoryId).name} ·{' '}
          {item.payment ? 'Pagamento registrado' : 'Despesa prevista'}
        </span>
      </div>
      <strong className="forecast-value">
        {money(item.payment?.amountCents ?? item.recurrence.amountCents)}
      </strong>
      {item.payment ? (
        <span className="paid-tag">
          <Check size={14} /> Paga
        </span>
      ) : (
        <button
          className="button small secondary"
          onClick={() => onPay(item)}
          aria-label={`Confirmar pagamento de ${item.recurrence.description} em ${monthLabel(item.month)}`}
        >
          Confirmar <span className="desktop-word">pagamento</span>
        </button>
      )}
    </div>
  );
}

function ExpenseChart({ data, month }: { data: FinanceData; month: string }) {
  const spending = categorySpending(data.transactions, month);
  const total = spending.reduce((sum, item) => sum + item.amount, 0);
  let position = 0;
  const gradient = spending
    .map((item) => {
      const start = position;
      position += (item.amount / total) * 100;
      return `${item.category.color} ${start}% ${position}%`;
    })
    .join(', ');
  return (
    <section className="panel spending-panel" aria-labelledby="spending-title">
      <div className="panel-heading">
        <div>
          <h2 id="spending-title">Para onde foi seu dinheiro</h2>
          <p>Despesas realizadas por categoria</p>
        </div>
        <span className="subtle-icon">
          <PiggyBank size={20} />
        </span>
      </div>
      {!total ? (
        <Empty title="Cada gasto conta uma história">
          As categorias aparecerão aqui quando você registrar despesas.
        </Empty>
      ) : (
        <div className="spending-chart">
          <div
            className="donut"
            role="img"
            aria-label={`Total de despesas realizadas: ${money(total)}. Detalhamento por categoria ao lado.`}
            style={
              {
                '--donut-gradient': `conic-gradient(${gradient})`,
              } as CSSProperties
            }
          >
            <div>
              <span>Total de despesas</span>
              <strong>{money(total)}</strong>
              <small>neste mês</small>
            </div>
          </div>
          <ul className="chart-legend">
            {spending.map(({ category, amount }) => (
              <li key={category.id}>
                <span className="legend-category">
                  <i style={{ background: category.color }} />
                  {category.name}
                </span>
                <strong>{money(amount)}</strong>
                <span className="legend-percent">
                  {Math.round((amount / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function Dashboard({
  data,
  month,
  onNavigate,
  onAdd,
  onEdit,
  onDelete,
  onBudget,
  onPay,
  onReview,
  onCloseMonth,
}: TransactionActions & {
  data: FinanceData;
  month: string;
  onNavigate: (view: View) => void;
  onAdd: () => void;
  onBudget: (budget?: Budget) => void;
  onPay: (item: Forecast) => void;
  onReview: () => void;
  onCloseMonth: () => void;
}) {
  const summary = totals(data.transactions, month);
  const budgets = data.budgets.filter((b) => b.month === month);
  const recent = data.transactions
    .filter((t) => t.date.startsWith(`${month}-`))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const pending = forecasts(data, month, 1).filter((item) => !item.payment);
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">UM PASSO DE CADA VEZ</div>
          <h1>
            Seu dinheiro, com mais clareza<span>.</span>
          </h1>
          <p>Entenda seu mês e organize o que vem pela frente.</p>
        </div>
        <AddButton onClick={onAdd}>Novo lançamento</AddButton>
      </div>
      <div className="stats-grid">
        <article className="stat-card balance-card">
          <div className="stat-label">
            Resultado do mês{' '}
            <span className="stat-icon">
              <Wallet size={20} />
            </span>
          </div>
          <strong
            className={summary.balance < 0 ? 'negative-balance' : ''}
            data-testid="monthly-balance"
          >
            {money(summary.balance)}
          </strong>
          <span className="stat-foot">
            <span className="balance-dot" />
            Receitas menos despesas realizadas
          </span>
          <svg
            className="balance-decoration"
            viewBox="0 0 160 100"
            aria-hidden="true"
          >
            <path d="M0 95 Q30 20 60 60 T160 5 M35 100 Q65 25 95 65 T195 10 M70 105 Q100 30 130 70 T230 15" />
          </svg>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Receitas{' '}
            <span className="stat-icon income-icon">
              <ArrowDownLeft size={21} />
            </span>
          </div>
          <strong data-testid="monthly-income">{money(summary.income)}</strong>
          <span className="stat-foot">Tudo o que entrou no mês</span>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Despesas{' '}
            <span className="stat-icon expense-icon">
              <ArrowUpRight size={21} />
            </span>
          </div>
          <strong data-testid="monthly-expense">
            {money(summary.expense)}
          </strong>
          <span className="stat-foot">Somente gastos já realizados</span>
        </article>
      </div>
      <div className="dashboard-middle">
        <ExpenseChart data={data} month={month} />
        <section className="panel budget-panel">
          <div className="panel-heading">
            <div>
              <h2>Seus limites, seu ritmo</h2>
              <p>Orçamentos de {monthLabel(month, true)}</p>
            </div>
            <button
              className="icon-button"
              onClick={() => onBudget()}
              aria-label="Adicionar orçamento"
            >
              <Plus size={19} />
            </button>
          </div>
          {budgets.length ? (
            <>
              <div className="budget-list">
                {budgets.slice(0, 3).map((b) => (
                  <BudgetCard
                    key={b.id}
                    budget={b}
                    data={data}
                    onEdit={() => onBudget(b)}
                  />
                ))}
              </div>
              <button
                className="text-button card-bottom-link"
                onClick={() => onNavigate('budgets')}
              >
                Ver todos os orçamentos <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <Empty title="Um plano para o seu mês">
              Defina seus próprios limites por categoria.
              <button className="text-button" onClick={() => onBudget()}>
                Criar primeiro orçamento <ArrowRight size={15} />
              </button>
            </Empty>
          )}
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Últimos lançamentos</h2>
              <p>Os movimentos mais recentes do mês</p>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate('transactions')}
            >
              Ver todos <ArrowRight size={15} />
            </button>
          </div>
          <TransactionList
            items={recent}
            compact
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </section>
        <aside className="habit-card">
          <span className="habit-icon">
            <Leaf size={27} strokeWidth={1.6} />
          </span>
          <div className="eyebrow">PEQUENOS HÁBITOS, MAIS CLAREZA</div>
          <h2>
            Organizar também
            <br />é cuidar de você.
          </h2>
          <p>Reserve um momento para conferir os lançamentos desta semana.</p>
          <button className="button secondary" onClick={onReview}>
            Conferir minha semana <ChevronRight size={17} />
          </button>
          <span className="habit-note">
            <Trophy size={14} /> Um hábito que vale uma conquista
          </span>
        </aside>
      </div>
      <section className="panel upcoming-panel">
        <div className="panel-heading">
          <div>
            <h2>De olho nas próximas contas</h2>
            <p>
              Previsões deste mês. Só entram no painel após confirmar o
              pagamento.
            </p>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate('recurrences')}
          >
            Ver 3 meses <ArrowRight size={15} />
          </button>
        </div>
        {pending.length ? (
          pending
            .slice(0, 3)
            .map((item) => (
              <ForecastRow key={item.recurrence.id} item={item} onPay={onPay} />
            ))
        ) : (
          <div className="inline-empty">
            <CircleCheck size={20} />
            <span>
              {data.recurrences.length
                ? 'Nenhuma conta prevista pendente neste mês.'
                : 'Cadastre suas contas recorrentes e veja o que vem pela frente.'}
            </span>
            <button
              className="text-button"
              onClick={() => onNavigate('recurrences')}
            >
              Ver contas
            </button>
          </div>
        )}
      </section>
      <div className="month-close">
        <span>
          <Flag size={18} />{' '}
          {data.closedMonths.includes(month)
            ? 'Fechamento conferido. Seus lançamentos continuam editáveis.'
            : 'Tudo conferido? Registre o fechamento do mês.'}
        </span>
        <button className="text-button" onClick={onCloseMonth}>
          Conferir fechamento <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}

export function TransactionsView({
  data,
  month,
  onAdd,
  onEdit,
  onDelete,
}: TransactionActions & {
  data: FinanceData;
  month: string;
  onAdd: () => void;
}) {
  const [kind, setKind] = useState('all');
  const [category, setCategory] = useState('all');
  const items = data.transactions
    .filter(
      (t) =>
        t.date.startsWith(`${month}-`) &&
        (kind === 'all' || t.kind === kind) &&
        (category === 'all' || t.categoryId === category),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">CADA MOVIMENTO IMPORTA</div>
          <h1>
            Lançamentos<span>.</span>
          </h1>
          <p>Registre o que entrou e saiu. O painel faz as contas.</p>
        </div>
        <AddButton onClick={onAdd}>Novo lançamento</AddButton>
      </div>
      <section className="panel">
        <div className="filter-bar">
          <div className="filter-fields">
            <label>
              Tipo
              <select
                aria-label="Tipo"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setCategory('all');
                }}
              >
                <option value="all">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </label>
            <label>
              Categoria
              <select
                aria-label="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories
                  .filter((c) => kind === 'all' || c.kind === kind)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <span className="muted">
            {items.length} {items.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>
        <TransactionList items={items} onEdit={onEdit} onDelete={onDelete} />
        <div className="table-footer">
          <span>Saldo dos itens filtrados</span>
          <strong>
            {money(
              items.reduce(
                (sum, t) =>
                  sum + (t.kind === 'income' ? t.amountCents : -t.amountCents),
                0,
              ),
            )}
          </strong>
        </div>
      </section>
    </>
  );
}

export function BudgetsView({
  data,
  month,
  onEdit,
  onDelete,
}: {
  data: FinanceData;
  month: string;
  onEdit: (b?: Budget) => void;
  onDelete: (b: Budget) => void;
}) {
  const items = data.budgets.filter((b) => b.month === month);
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">PLANEJAMENTO DO SEU JEITO</div>
          <h1>
            Orçamentos<span>.</span>
          </h1>
          <p>Um limite por categoria, mais consciência no dia a dia.</p>
        </div>
        <AddButton onClick={() => onEdit()}>Definir orçamento</AddButton>
      </div>
      <div className="info-banner">
        <CircleHelp size={20} />
        <p>
          Você define os limites de cada mês. <strong>A partir de 80%</strong>,
          sinalizamos atenção; acima de 100%, o limite foi ultrapassado. Estes
          valores não são recomendações financeiras.
        </p>
      </div>
      {items.length ? (
        <div className="budgets-grid">
          {items.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              data={data}
              onEdit={() => onEdit(b)}
              onDelete={() => onDelete(b)}
            />
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty title="Dê um destino ao seu planejamento">
            Os limites são independentes para cada mês.
            <button className="button primary" onClick={() => onEdit()}>
              <Plus size={17} />
              Criar primeiro orçamento
            </button>
          </Empty>
        </section>
      )}
    </>
  );
}

export function RecurrencesView({
  data,
  month,
  onAdd,
  onPay,
  onToggle,
}: {
  data: FinanceData;
  month: string;
  onAdd: () => void;
  onPay: (item: Forecast) => void;
  onToggle: (r: Recurrence) => void;
}) {
  const items = forecasts(data, month);
  const months = [...new Set(items.map((i) => i.month))];
  const pendingTotal = items
    .filter((i) => !i.payment)
    .reduce((s, i) => s + i.recurrence.amountCents, 0);
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">MENOS SURPRESAS NO CAMINHO</div>
          <h1>
            Contas recorrentes<span>.</span>
          </h1>
          <p>Veja o mês selecionado e os dois seguintes, em um só lugar.</p>
        </div>
        <AddButton onClick={onAdd}>Cadastrar conta</AddButton>
      </div>
      <div className="info-banner">
        <CalendarClock size={21} />
        <p>
          <strong>Previsto é diferente de realizado.</strong> Uma conta só vira
          despesa quando você confirma o pagamento. Cada conta pode ser paga uma
          vez por mês. O registro usa a data do vencimento.
        </p>
      </div>
      <div className="recurrence-summary">
        <span>Previsões ainda não pagas · janela de 3 meses</span>
        <strong>{money(pendingTotal)}</strong>
      </div>
      {months.length ? (
        months.map((m) => (
          <section className="panel forecast-panel" key={m}>
            <div className="panel-heading">
              <div>
                <h2 className="capitalize">{monthLabel(m)}</h2>
                <p>
                  {items.filter((i) => i.month === m && !i.payment).length}{' '}
                  contas pendentes
                </p>
              </div>
              <span className="pill">Mensal</span>
            </div>
            {items
              .filter((i) => i.month === m)
              .map((item) => (
                <ForecastRow
                  key={`${item.recurrence.id}:${m}`}
                  item={item}
                  onPay={onPay}
                />
              ))}
          </section>
        ))
      ) : (
        <section className="panel">
          <Empty title="O próximo mês pode ser mais previsível">
            Cadastre aluguel, internet ou outra conta mensal. Nenhum pagamento é
            automático.
            <button className="button primary" onClick={onAdd}>
              <Plus size={17} />
              Cadastrar primeira conta
            </button>
          </Empty>
        </section>
      )}
      {data.recurrences.length > 0 && (
        <section className="panel accounts-panel">
          <div className="panel-heading">
            <div>
              <h2>Contas cadastradas</h2>
              <p>
                Pausar remove as previsões não pagas. O histórico de pagamentos
                é preservado.
              </p>
            </div>
          </div>
          {data.recurrences.map((r) => (
            <div className="account-row" key={r.id}>
              <CategoryIcon category={categoryById(r.categoryId)} />
              <div className="account-description">
                <strong>{r.description}</strong>
                <span>
                  Dia {r.dueDay} · desde {monthLabel(r.startMonth, true)} ·{' '}
                  {money(r.amountCents)}/mês
                </span>
              </div>
              <span className={`pill ${r.active ? 'green' : ''}`}>
                {r.active ? 'Ativa' : 'Pausada'}
              </span>
              <button className="text-button" onClick={() => onToggle(r)}>
                {r.active ? 'Pausar' : 'Reativar'}
                <RotateCcw size={14} />
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

export function AchievementsView({
  data,
  onReview,
  onCloseMonth,
}: {
  data: FinanceData;
  onReview: () => void;
  onCloseMonth: () => void;
}) {
  const list = [
    {
      id: 'first-budget' as const,
      title: 'Um plano começa aqui',
      text: 'Configure seu primeiro limite mensal por categoria.',
      icon: PiggyBank,
    },
    {
      id: 'weekly-review' as const,
      title: 'Uma pausa para conferir',
      text: 'Confira os lançamentos de uma semana e registre a revisão.',
      icon: CheckCheck,
    },
    {
      id: 'first-close' as const,
      title: 'Um mês com mais clareza',
      text: 'Confira o resumo e conclua seu primeiro fechamento mensal.',
      icon: Flag,
    },
  ];
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">HÁBITOS QUE FAZEM SENTIDO</div>
          <h1>
            Pequenas conquistas<span>.</span>
          </h1>
          <p>Reconheça seu cuidado com a organização, no seu ritmo.</p>
        </div>
        <span className="achievement-count">
          <Trophy size={20} />
          {data.achievements.length} de 3
        </span>
      </div>
      <div className="achievements-grid">
        {list.map(({ id, title, text, icon: Icon }) => {
          const done = data.achievements.includes(id);
          return (
            <article
              className={`achievement-card ${done ? 'unlocked' : ''}`}
              key={id}
            >
              <span className="medal">
                <Icon size={32} strokeWidth={1.5} />
              </span>
              <span className="pill">
                {done ? (
                  <>
                    <Check size={13} />
                    Conquistada
                  </>
                ) : (
                  <>
                    <LockKeyhole size={12} />
                    Por descobrir
                  </>
                )}
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          );
        })}
      </div>
      <section className="panel achievement-actions">
        <div>
          <h2>Organizar vale mais que pontuar</h2>
          <p>
            Não há pontos por gastar ou repetir lançamentos. Cada conquista é
            registrada uma única vez. Na demonstração, o primeiro orçamento já
            está configurado.
          </p>
        </div>
        <div className="inline">
          <button className="button secondary" onClick={onReview}>
            Conferir semana
          </button>
          <button className="button primary" onClick={onCloseMonth}>
            Conferir fechamento
          </button>
        </div>
      </section>
      {data.closedMonths.length > 0 && (
        <div className="info-banner">
          <ShieldCheck size={21} />
          <p>
            Fechamentos conferidos:{' '}
            {data.closedMonths
              .slice()
              .sort()
              .map((m) => monthLabel(m, true))
              .join(', ')}
            . A conferência não bloqueia novas alterações nos lançamentos.
          </p>
        </div>
      )}
    </>
  );
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function DataView({
  data,
  onExport,
  onImport,
  onDemo,
  onReset,
  onRecover,
}: {
  data: FinanceData;
  onExport: () => void;
  onImport: (data: FinanceData) => void;
  onDemo: () => void;
  onReset: () => void;
  onRecover: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">SEUS DADOS, SOB SEU CONTROLE</div>
          <h1>
            Dados e backup<span>.</span>
          </h1>
          <p>Guarde uma cópia do seu planejamento e experimente à vontade.</p>
        </div>
      </div>
      <div className="info-banner">
        <ShieldCheck size={21} />
        <p>
          Os dados ficam apenas neste navegador e neste endereço. Não há conta,
          servidor ou conexão bancária. Limpar os dados do site ou usar outro
          dispositivo não preserva seus registros.{' '}
          <strong>Exporte backups regularmente.</strong>
        </p>
      </div>
      <div className="data-grid">
        <section className="panel data-card">
          <span className="data-icon">
            <Download size={25} />
          </span>
          <h2>Leve uma cópia com você</h2>
          <p>
            Exporte lançamentos, limites, contas e conquistas em um arquivo
            JSON. Guarde-o em um local privado.
          </p>
          <span className="data-detail">
            {data.transactions.length} lançamentos · {data.budgets.length}{' '}
            orçamentos · {data.recurrences.length} contas
          </span>
          <button className="button primary" onClick={onExport}>
            <Download size={16} />
            Exportar backup
          </button>
        </section>
        <section className="panel data-card">
          <span className="data-icon">
            <Upload size={25} />
          </span>
          <h2>Retome de onde parou</h2>
          <p>
            Importe um backup do Clareza Financeira. O arquivo é validado antes
            da confirmação e substitui os dados atuais.
          </p>
          <span className="data-detail">
            Formato JSON · versão 1 · até 5 MB
          </span>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Arquivo de backup"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                setError('');
                if (file.size > MAX_BACKUP_BYTES)
                  throw new Error('O arquivo excede o limite de 5 MB.');
                onImport(parseBackup(await file.text()));
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : 'Não foi possível ler o arquivo.',
                );
              }
            }}
          />
          <button
            className="button secondary"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            Escolher backup
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </section>
      </div>
      <section className="demo-card">
        <span className="demo-icon">
          <Sparkles size={27} />
        </span>
        <div>
          <div className="eyebrow">UM AMBIENTE PARA EXPERIMENTAR</div>
          <h2>Conheça o app com dados fictícios</h2>
          <p>
            Carregue um pequeno exemplo com receitas, despesas, limites e
            contas. Qualquer substituição pede confirmação.
          </p>
        </div>
        <button className="button secondary" onClick={onDemo}>
          Carregar demonstração <ArrowRight size={16} />
        </button>
      </section>
      <section className="panel data-details">
        <div className="inline">
          <FolderHeart size={20} />
          <h2>Cuidados com seus registros</h2>
        </div>
        <p>
          Não use dados de empresas ou clientes na apresentação. Os backups não
          são criptografados. O app funciona sem APIs, tokens ou serviços pagos;
          a IA foi usada no desenvolvimento e está documentada no projeto.
        </p>
        <div className="data-maintenance">
          <button className="text-button" onClick={onRecover}>
            Baixar dados locais para recuperação
          </button>
          <button className="text-button danger" onClick={onReset}>
            <Trash2 size={15} />
            Apagar todos os dados
          </button>
        </div>
      </section>
    </>
  );
}
