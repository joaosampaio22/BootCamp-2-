import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  categories,
  expenseCategories,
  moneyInput,
  newId,
  parseMoney,
  todayLocal,
} from './domain';
import type { Budget, Kind, Recurrence, Transaction } from './domain';

type CommonProps<T> = {
  initial?: T;
  month: string;
  onSave: (value: T) => boolean;
  onCancel: () => void;
};
function FormError({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null;
}
function FormActions({
  onCancel,
  label = 'Salvar',
}: {
  onCancel: () => void;
  label?: string;
}) {
  return (
    <div className="form-actions">
      <button className="button secondary" type="button" onClick={onCancel}>
        Cancelar
      </button>
      <button className="button primary" type="submit">
        <Check size={17} />
        {label}
      </button>
    </div>
  );
}
export function TransactionForm({
  initial,
  month,
  onSave,
  onCancel,
}: CommonProps<Transaction>) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? 'expense');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'food');
  const [error, setError] = useState('');
  const linked = !!initial?.recurrenceId;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fields = new FormData(e.currentTarget);
        try {
          const value: Transaction = {
            id: initial?.id ?? newId(),
            kind,
            categoryId,
            description: String(fields.get('description')).trim(),
            date: String(fields.get('date')),
            amountCents: parseMoney(String(fields.get('amount'))),
          };
          if (linked) {
            value.recurrenceId = initial.recurrenceId;
            value.occurrenceMonth = initial.occurrenceMonth;
          }
          onSave(value);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Verifique os campos.');
        }
      }}
    >
      <div className="segmented" role="group" aria-label="Tipo do lançamento">
        {(['expense', 'income'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            disabled={linked && value === 'income'}
            className={kind === value ? 'selected' : ''}
            onClick={() => {
              setKind(value);
              setCategoryId(value === 'income' ? 'salary' : 'food');
            }}
          >
            {value === 'income' ? 'Receita' : 'Despesa'}
          </button>
        ))}
      </div>
      <label>
        Descrição
        <input
          name="description"
          placeholder="Ex.: compras da semana"
          defaultValue={initial?.description}
          maxLength={100}
          required
          autoFocus
        />
      </label>
      <div className="form-grid">
        <label>
          Valor (R$)
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={initial ? moneyInput(initial.amountCents) : ''}
            maxLength={20}
            required
          />
        </label>
        <label>
          Data
          <input
            name="date"
            type="date"
            min={linked ? `${initial.occurrenceMonth}-01` : '1900-01-01'}
            max={
              linked
                ? `${initial.occurrenceMonth}-${new Date(Number(initial.occurrenceMonth!.slice(0, 4)), Number(initial.occurrenceMonth!.slice(5)), 0).getDate()}`
                : '2199-12-31'
            }
            defaultValue={
              initial?.date ??
              (month === todayLocal().slice(0, 7)
                ? todayLocal()
                : `${month}-01`)
            }
            required
          />
        </label>
      </div>
      <label>
        Categoria
        <select
          name="category"
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value as Transaction['categoryId'])
          }
        >
          {categories
            .filter((c) => c.kind === kind)
            .map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      {linked && (
        <p className="field-help">
          Pagamento vinculado a uma conta. A data deve permanecer no mês da
          previsão. Excluir o lançamento reabre a conta.
        </p>
      )}
      <FormError message={error} />
      <FormActions
        onCancel={onCancel}
        label={initial ? 'Salvar alterações' : 'Adicionar lançamento'}
      />
    </form>
  );
}
export function BudgetForm({
  initial,
  month,
  onSave,
  onCancel,
}: CommonProps<Budget>) {
  const [error, setError] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fields = new FormData(e.currentTarget);
        try {
          onSave({
            id: initial?.id ?? newId(),
            month,
            categoryId: String(fields.get('category')) as Budget['categoryId'],
            limitCents: parseMoney(String(fields.get('limit'))),
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Verifique os campos.');
        }
      }}
    >
      <label>
        Categoria
        <select
          name="category"
          defaultValue={initial?.categoryId ?? 'food'}
          disabled={!!initial}
        >
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {initial && (
        <input type="hidden" name="category" value={initial.categoryId} />
      )}
      <label>
        Limite mensal (R$)
        <input
          name="limit"
          inputMode="decimal"
          placeholder="Ex.: 600,00"
          defaultValue={initial ? moneyInput(initial.limitCents) : ''}
          maxLength={20}
          required
          autoFocus
        />
      </label>
      <p className="field-help">
        O limite é definido por você e vale somente para o mês selecionado.
        Salvar uma categoria já configurada atualiza seu limite. Não é uma
        recomendação financeira.
      </p>
      <FormError message={error} />
      <FormActions onCancel={onCancel} label="Salvar orçamento" />
    </form>
  );
}
export function RecurrenceForm({
  month,
  onSave,
  onCancel,
}: Omit<CommonProps<Recurrence>, 'initial'>) {
  const [error, setError] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fields = new FormData(e.currentTarget);
        try {
          onSave({
            id: newId(),
            description: String(fields.get('description')).trim(),
            amountCents: parseMoney(String(fields.get('amount'))),
            categoryId: String(
              fields.get('category'),
            ) as Recurrence['categoryId'],
            dueDay: Number(fields.get('day')),
            startMonth: String(fields.get('startMonth')),
            active: true,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Verifique os campos.');
        }
      }}
    >
      <label>
        Descrição
        <input
          name="description"
          placeholder="Ex.: internet de casa"
          maxLength={100}
          required
          autoFocus
        />
      </label>
      <div className="form-grid">
        <label>
          Valor mensal (R$)
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            maxLength={20}
            required
          />
        </label>
        <label>
          Dia do vencimento
          <input
            name="day"
            type="number"
            min={1}
            max={31}
            defaultValue={10}
            required
          />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Categoria
          <select name="category" defaultValue="home">
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          A partir de
          <input
            name="startMonth"
            type="month"
            defaultValue={month}
            min="1900-01"
            max="2199-10"
            required
          />
        </label>
      </div>
      <p className="field-help">
        Repetição mensal. Se o mês não tiver o dia escolhido, usamos o último
        dia. Só confirmar o pagamento cria uma despesa realizada, com a data do
        vencimento; você pode editá-la dentro do mesmo mês.
      </p>
      <FormError message={error} />
      <FormActions onCancel={onCancel} label="Cadastrar conta" />
    </form>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="button primary" onClick={onClick}>
      <Plus size={18} />
      {children}
    </button>
  );
}
