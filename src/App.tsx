import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Database,
  LayoutDashboard,
  Leaf,
  ListFilter,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  addMonths,
  categoryById,
  closeMonth,
  confirmPayment,
  demoData,
  emptyData,
  isMonth,
  money,
  monthLabel,
  reviewWeek,
  saveBudget,
  saveTransaction,
  todayLocal,
  totals,
  validateData,
  weekStart,
} from './domain';
import type {
  Budget,
  FinanceData,
  Forecast,
  Recurrence,
  Transaction,
} from './domain';
import { BudgetForm, RecurrenceForm, TransactionForm } from './forms';
import { loadData, STORAGE_KEY, writeStorage } from './storage';
import {
  AchievementsView,
  BudgetsView,
  Dashboard,
  DataView,
  downloadText,
  RecurrencesView,
  TransactionsView,
} from './views';
import type { View } from './views';
import { Modal } from './ui';

type ModalState =
  | { type: 'transaction'; initial?: Transaction }
  | { type: 'budget'; initial?: Budget }
  | { type: 'recurrence' }
  | { type: 'review' }
  | { type: 'close' }
  | {
      type: 'confirm';
      title: string;
      text: ReactNode;
      button?: string;
      danger?: boolean;
      onConfirm: () => boolean;
    };
const navigation = [
  { id: 'dashboard' as const, title: 'Visão geral', icon: LayoutDashboard },
  { id: 'transactions' as const, title: 'Lançamentos', icon: ListFilter },
  { id: 'budgets' as const, title: 'Orçamentos', icon: PiggyBank },
  {
    id: 'recurrences' as const,
    title: 'Contas recorrentes',
    icon: CalendarClock,
  },
  { id: 'achievements' as const, title: 'Conquistas', icon: Trophy },
];

export default function App() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { ...loadData(raw), raw };
    } catch {
      return {
        data: emptyData(),
        warning:
          'O armazenamento está bloqueado. Habilite os dados de sites neste navegador para salvar suas alterações.',
        locked: true,
        raw: null,
      };
    }
  });
  const [data, setData] = useState(initial.data);
  const dataRef = useRef(data);
  const rawRef = useRef(initial.raw);
  const [warning, setWarning] = useState(initial.warning);
  const [locked, setLocked] = useState(initial.locked);
  const [view, setView] = useState<View>('dashboard');
  const [month, setMonth] = useState(todayLocal().slice(0, 7));
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(
    null,
  );
  const today = todayLocal();
  const title =
    navigation.find((n) => n.id === view)?.title ?? 'Dados e backup';

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const loaded = loadData(event.newValue);
      rawRef.current = event.newValue;
      dataRef.current = loaded.data;
      setData(loaded.data);
      setWarning(loaded.warning);
      setLocked(loaded.locked);
      setModal(null);
      setToast({
        text: 'Os dados foram atualizados em outra aba. Confira a versão mais recente.',
      });
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const commit = (
    transform: (current: FinanceData) => FinanceData,
    message: string,
    replace = false,
  ): boolean => {
    try {
      if (locked && !replace)
        throw new Error(
          'Os dados locais estão protegidos para recuperação. Use Dados e backup antes de continuar.',
        );
      if (localStorage.getItem(STORAGE_KEY) !== rawRef.current)
        throw new Error(
          'Outra aba alterou os dados. Recarregue a página antes de salvar.',
        );
      const next = validateData(transform(dataRef.current));
      writeStorage(next);
      dataRef.current = next;
      rawRef.current = JSON.stringify(next);
      setData(next);
      setLocked(false);
      setWarning('');
      setToast({ text: message });
      return true;
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar. Confira os campos.';
      setToast({
        text: text.startsWith('[')
          ? 'Confira os campos: descrição, data, categoria e valor precisam ser válidos.'
          : text,
        error: true,
      });
      return false;
    }
  };
  const saveAndClose = (
    transform: (current: FinanceData) => FinanceData,
    message: string,
  ) => {
    const success = commit(transform, message);
    if (success) setModal(null);
    return success;
  };
  const navigate = (target: View) => {
    setView(target);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const onEdit = (t: Transaction) =>
    setModal({ type: 'transaction', initial: t });
  const onBudget = (b?: Budget) => setModal({ type: 'budget', initial: b });
  const onDelete = (t: Transaction) =>
    setModal({
      type: 'confirm',
      title: 'Excluir lançamento?',
      text: (
        <>
          O lançamento <strong>{t.description}</strong>, de{' '}
          {money(t.amountCents)}, será removido.
          {t.recurrenceId &&
            ' A conta recorrente ficará pendente novamente neste mês.'}{' '}
          O painel e os orçamentos serão recalculados.
        </>
      ),
      button: 'Excluir lançamento',
      danger: true,
      onConfirm: () =>
        commit(
          (current) => ({
            ...current,
            transactions: current.transactions.filter(
              (item) => item.id !== t.id,
            ),
          }),
          'Lançamento excluído. Os totais foram atualizados.',
        ),
    });
  const onPay = (item: Forecast) =>
    setModal({
      type: 'confirm',
      title: 'Confirmar pagamento?',
      text: (
        <>
          Você está registrando{' '}
          <strong>{money(item.recurrence.amountCents)}</strong> em{' '}
          <strong>{item.recurrence.description}</strong>, com data de vencimento{' '}
          {item.date.split('-').reverse().join('/')}. Isso cria uma despesa
          realizada no painel de {monthLabel(item.month)}. Não há movimentação
          bancária.
        </>
      ),
      button: 'Confirmar pagamento',
      onConfirm: () =>
        commit(
          (current) => confirmPayment(current, item.recurrence.id, item.month),
          'Pagamento registrado uma única vez. Painel e orçamento atualizados.',
        ),
    });
  const onDemo = () =>
    setModal({
      type: 'confirm',
      title: 'Carregar dados fictícios?',
      text: (
        <>
          {locked
            ? 'O conteúdo local que não pôde ser lido será substituído. Baixe uma cópia de recuperação antes de continuar. '
            : ''}
          Isso substitui todos os dados atuais por um exemplo de{' '}
          {monthLabel(month)}. Exporte um backup antes de continuar se quiser
          preservar seus registros. Todos os valores da demonstração são
          inventados.
        </>
      ),
      button: 'Carregar demonstração',
      onConfirm: () =>
        commit(
          () => demoData(month),
          'Demonstração carregada. Todos os dados são fictícios.',
          true,
        ),
    });
  const onCloseMonth = () => {
    if (month > today.slice(0, 7)) {
      setToast({
        text: 'Selecione o mês atual ou um mês anterior para conferir o fechamento.',
        error: true,
      });
      return;
    }
    setModal({ type: 'close' });
  };
  const onToggle = (r: Recurrence) =>
    setModal({
      type: 'confirm',
      title: r.active
        ? 'Pausar conta recorrente?'
        : 'Reativar conta recorrente?',
      text: r.active ? (
        <>
          As previsões não pagas de <strong>{r.description}</strong> deixarão de
          aparecer. Os pagamentos já registrados serão preservados. Você pode
          reativar a conta depois.
        </>
      ) : (
        <>
          As previsões mensais de <strong>{r.description}</strong> voltarão a
          aparecer desde o mês inicial. Nenhum pagamento será criado
          automaticamente.
        </>
      ),
      button: r.active ? 'Pausar conta' : 'Reativar conta',
      onConfirm: () =>
        commit(
          (current) => ({
            ...current,
            recurrences: current.recurrences.map((item) =>
              item.id === r.id ? { ...item, active: !item.active } : item,
            ),
          }),
          r.active
            ? 'Conta pausada. Histórico preservado.'
            : 'Conta reativada.',
        ),
    });
  const isDemo = data.transactions.some((t) => t.id.startsWith('demo-'));
  const close = () => setModal(null);
  const week = weekStart(today);
  const weekEndDate = new Date(`${week}T12:00:00`);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = todayLocal(weekEndDate);
  const weekTransactions = data.transactions
    .filter((t) => t.date >= week && t.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
  const summary = totals(data.transactions, month);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate('dashboard');
          }}
          aria-label="Clareza Financeira, visão geral"
        >
          <span className="brand-symbol">
            <BarChart3 size={26} strokeWidth={2.5} />
          </span>
          <span>
            clareza<span className="brand-subtitle">FINANCEIRA</span>
          </span>
          <span className="brand-dot">.</span>
        </a>
        <span className="nav-label">SEU ESPAÇO</span>
        <nav aria-label="Navegação principal">
          {navigation.map(({ id, title: name, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{name}</span>
              {view === id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="local-icon">
              <LockKeyhole size={20} />
            </span>
            <strong>Só seu. Só aqui.</strong>
            <p>Seus dados ficam neste navegador, sob seu controle.</p>
            <span>
              <ShieldCheck size={13} /> Sem conexão bancária
            </span>
          </div>
          <button
            className={`nav-item data-nav ${view === 'data' ? 'active' : ''}`}
            onClick={() => navigate('data')}
            aria-current={view === 'data' ? 'page' : undefined}
          >
            <Database size={19} />
            <span>Dados e backup</span>
          </button>
          <div className="sidebar-footer">
            <span className="online-dot" /> Organize hoje. Respire amanhã.
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Meu espaço</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span />
              {isDemo ? 'Dados fictícios' : 'Salvo no navegador'}
            </span>
            <div className="month-picker">
              <button
                className="icon-button"
                aria-label="Mês anterior"
                disabled={month <= '1900-01'}
                onClick={() => setMonth(addMonths(month, -1))}
              >
                <ChevronLeft size={17} />
              </button>
              <label className="month-input-label">
                <span className="month-display">
                  {monthLabel(month)}
                  <CalendarDays size={14} />
                </span>
                <input
                  type="month"
                  aria-label="Mês selecionado"
                  value={month}
                  min="1900-01"
                  max="2199-10"
                  onChange={(e) => {
                    if (isMonth(e.target.value) && e.target.value <= '2199-10')
                      setMonth(e.target.value);
                  }}
                />
              </label>
              <button
                className="icon-button"
                aria-label="Próximo mês"
                disabled={month >= '2199-10'}
                onClick={() => setMonth(addMonths(month, 1))}
              >
                <ChevronRight size={17} />
              </button>
            </div>
            <span
              className="profile-mark"
              role="img"
              aria-label="Seu espaço pessoal"
            >
              <Leaf size={19} />
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {warning && (
            <div className="warning-banner" role="alert">
              <CircleAlert size={21} />
              <p>{warning}</p>
              <button className="text-button" onClick={() => navigate('data')}>
                Dados e backup <ArrowRight size={14} />
              </button>
            </div>
          )}
          {!data.transactions.length && !locked && view === 'dashboard' && (
            <div className="welcome-banner">
              <Sparkles size={22} />
              <div>
                <strong>Seu primeiro passo pode ser só experimentar.</strong>
                <span>
                  Explore com dados fictícios, sem precisar cadastrar nada.
                </span>
              </div>
              <button className="button secondary small" onClick={onDemo}>
                Experimentar demonstração <ArrowRight size={15} />
              </button>
            </div>
          )}
          {view === 'dashboard' && (
            <Dashboard
              data={data}
              month={month}
              onNavigate={navigate}
              onAdd={() => setModal({ type: 'transaction' })}
              onEdit={onEdit}
              onDelete={onDelete}
              onBudget={onBudget}
              onPay={onPay}
              onReview={() => setModal({ type: 'review' })}
              onCloseMonth={onCloseMonth}
            />
          )}
          {view === 'transactions' && (
            <TransactionsView
              data={data}
              month={month}
              onAdd={() => setModal({ type: 'transaction' })}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
          {view === 'budgets' && (
            <BudgetsView
              data={data}
              month={month}
              onEdit={onBudget}
              onDelete={(b) =>
                setModal({
                  type: 'confirm',
                  title: 'Excluir orçamento?',
                  text: (
                    <>
                      O limite de {categoryName(b.categoryId)} para{' '}
                      {monthLabel(b.month)} será removido. Os lançamentos desta
                      categoria serão preservados.
                    </>
                  ),
                  button: 'Excluir orçamento',
                  danger: true,
                  onConfirm: () =>
                    commit(
                      (current) => ({
                        ...current,
                        budgets: current.budgets.filter(
                          (item) => item.id !== b.id,
                        ),
                      }),
                      'Orçamento removido. Lançamentos preservados.',
                    ),
                })
              }
            />
          )}
          {view === 'recurrences' && (
            <RecurrencesView
              data={data}
              month={month}
              onAdd={() => setModal({ type: 'recurrence' })}
              onPay={onPay}
              onToggle={onToggle}
            />
          )}
          {view === 'achievements' && (
            <AchievementsView
              data={data}
              onReview={() => setModal({ type: 'review' })}
              onCloseMonth={onCloseMonth}
            />
          )}
          {view === 'data' && (
            <DataView
              data={data}
              onDemo={onDemo}
              onExport={() => {
                if (locked) {
                  setToast({
                    text: 'Use a cópia de recuperação para preservar os dados originais.',
                    error: true,
                  });
                  return;
                }
                downloadText(
                  `clareza-backup-${today}.json`,
                  JSON.stringify(dataRef.current, null, 2),
                );
                setToast({
                  text: 'Backup exportado. Guarde o arquivo em um local privado.',
                });
              }}
              onImport={(backup) =>
                setModal({
                  type: 'confirm',
                  title: 'Restaurar este backup?',
                  text: (
                    <>
                      O arquivo validado contém{' '}
                      <strong>
                        {backup.transactions.length} lançamentos,{' '}
                        {backup.budgets.length} orçamentos e{' '}
                        {backup.recurrences.length} contas
                      </strong>
                      . Isso substitui todos os dados atuais, incluindo
                      conquistas. A importação não mescla os registros. Exporte
                      uma cópia antes de continuar.
                    </>
                  ),
                  button: 'Restaurar backup',
                  onConfirm: () =>
                    commit(
                      () => backup,
                      'Backup restaurado com sucesso.',
                      true,
                    ),
                })
              }
              onReset={() =>
                setModal({
                  type: 'confirm',
                  title: 'Apagar todos os dados?',
                  text: 'Esta ação remove lançamentos, orçamentos, contas e conquistas deste navegador. Exporte um backup ou uma cópia de recuperação antes de continuar. A ação não pode ser desfeita sem um backup.',
                  button: 'Apagar todos os dados',
                  danger: true,
                  onConfirm: () =>
                    commit(
                      () => emptyData(),
                      'Dados apagados deste navegador.',
                      true,
                    ),
                })
              }
              onRecover={() => {
                try {
                  const raw = localStorage.getItem(STORAGE_KEY);
                  if (!raw)
                    throw new Error('Não há dados locais para recuperar.');
                  downloadText(`clareza-recuperacao-${today}.json`, raw);
                } catch (err) {
                  setToast({
                    text:
                      err instanceof Error
                        ? err.message
                        : 'Não foi possível acessar os dados.',
                    error: true,
                  });
                }
              }}
            />
          )}
          <footer className="main-footer">
            <span>
              <Leaf size={14} /> Clareza Financeira
            </span>
            <span>Mais organização. Um mês de cada vez.</span>
            <span>BRL · Dados locais</span>
          </footer>
        </main>
      </div>
      {toast && !(modal && toast.error) && (
        <div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
        >
          {toast.error ? <CircleAlert size={19} /> : <CircleCheckIcon />}
          <span>{toast.text}</span>
          <button
            className="icon-button"
            aria-label="Fechar mensagem"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal?.type === 'transaction' && (
        <Modal
          title={modal.initial ? 'Editar lançamento' : 'Novo lançamento'}
          subtitle="Registre um movimento realizado. Os totais são atualizados ao salvar."
          onClose={close}
          error={toast?.error ? toast.text : undefined}
        >
          <TransactionForm
            initial={modal.initial}
            month={month}
            onCancel={close}
            onSave={(value) =>
              saveAndClose(
                (current) => saveTransaction(current, value),
                modal.initial
                  ? 'Lançamento atualizado.'
                  : 'Lançamento adicionado.',
              )
            }
          />
        </Modal>
      )}
      {modal?.type === 'budget' && (
        <Modal
          title={modal.initial ? 'Editar orçamento' : 'Definir orçamento'}
          subtitle={`Um limite escolhido por você para ${monthLabel(month)}.`}
          onClose={close}
          error={toast?.error ? toast.text : undefined}
        >
          <BudgetForm
            initial={modal.initial}
            month={month}
            onCancel={close}
            onSave={(value) =>
              saveAndClose(
                (current) => saveBudget(current, value),
                'Orçamento salvo. Seu planejamento ganhou mais clareza.',
              )
            }
          />
        </Modal>
      )}
      {modal?.type === 'recurrence' && (
        <Modal
          title="Nova conta recorrente"
          subtitle="Planeje uma despesa mensal. O pagamento depende da sua confirmação."
          onClose={close}
          error={toast?.error ? toast.text : undefined}
        >
          <RecurrenceForm
            month={month}
            onCancel={close}
            onSave={(value) =>
              saveAndClose(
                (current) => ({
                  ...current,
                  recurrences: [...current.recurrences, value],
                }),
                'Conta cadastrada. As previsões já estão disponíveis.',
              )
            }
          />
        </Modal>
      )}
      {modal?.type === 'confirm' && (
        <Modal
          title={modal.title}
          onClose={close}
          error={toast?.error ? toast.text : undefined}
        >
          <p className="confirm-text">{modal.text}</p>
          <div className="form-actions">
            <button className="button secondary" onClick={close}>
              Cancelar
            </button>
            <button
              className={`button ${modal.danger ? 'danger-button' : 'primary'}`}
              onClick={() => {
                if (modal.onConfirm()) close();
              }}
            >
              {modal.button ?? 'Confirmar'}
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === 'review' && (
        <Modal
          title="Uma pausa para conferir"
          subtitle={`Semana de ${week.split('-').reverse().join('/')} a ${weekEnd.split('-').reverse().join('/')}.`}
          onClose={close}
          error={toast?.error ? toast.text : undefined}
        >
          <p className="field-help">
            Confira se as descrições e os valores estão corretos. Você pode
            editar os registros na página Lançamentos.
          </p>
          <div className="review-list">
            {weekTransactions.length ? (
              weekTransactions.map((t) => (
                <div key={t.id}>
                  <span>
                    {t.description}
                    <small>{t.date.split('-').reverse().join('/')}</small>
                  </span>
                  <strong>
                    {t.kind === 'income' ? '+' : '−'} {money(t.amountCents)}
                  </strong>
                </div>
              ))
            ) : (
              <p>
                Nenhum lançamento nesta semana. Você pode registrar que conferiu
                mesmo assim.
              </p>
            )}
          </div>
          <p className="field-help">
            {data.reviewedWeeks.includes(week)
              ? 'Esta semana já foi conferida. Conferir novamente não gera novas conquistas.'
              : 'Este registro reconhece o hábito de conferir, sem pontos por gastar.'}
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={close}>
              Voltar
            </button>
            <button
              className="button primary"
              onClick={() =>
                saveAndClose(
                  (current) => reviewWeek(current, today),
                  'Semana conferida. Conquista registrada!',
                )
              }
            >
              <CheckCheck size={18} />
              Conferi os lançamentos
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === 'close' && (
        <Modal
          title="Fechamento do mês"
          subtitle={`Confira seu resumo de ${monthLabel(month)}.`}
          onClose={close}
          error={toast?.error ? toast.text : undefined}
        >
          <div className="closing-summary">
            <div>
              <span>Receitas</span>
              <strong>{money(summary.income)}</strong>
            </div>
            <div>
              <span>Despesas realizadas</span>
              <strong>{money(summary.expense)}</strong>
            </div>
            <div>
              <span>Resultado do mês</span>
              <strong>{money(summary.balance)}</strong>
            </div>
          </div>
          <p className="field-help">
            As previsões não pagas ficam fora deste resumo. O fechamento
            registra sua conferência e não bloqueia alterações futuras. Se os
            valores mudarem, confira novamente.
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={close}>
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button
              className="button primary"
              onClick={() =>
                saveAndClose(
                  (current) => closeMonth(current, month, today.slice(0, 7)),
                  'Fechamento conferido. Conquista registrada!',
                )
              }
            >
              <Check size={16} />
              Concluir fechamento
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const categoryName = (id: string) => categoryById(id).name;
function CircleCheckIcon() {
  return <ShieldCheck size={19} />;
}
