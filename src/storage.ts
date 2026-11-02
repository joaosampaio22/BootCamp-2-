import { emptyData, parseBackup, validateData } from './domain';
import type { FinanceData } from './domain';

export const STORAGE_KEY = 'clareza-financeira:v1';
export type LoadResult = {
  data: FinanceData;
  warning: string;
  locked: boolean;
};

export function loadData(raw: string | null): LoadResult {
  if (raw === null) return { data: emptyData(), warning: '', locked: false };
  try {
    const parsed = JSON.parse(raw);
    // Recover only missing collections from a known version. Invalid records are never discarded.
    const missing =
      parsed?.version === 1 &&
      [
        'transactions',
        'budgets',
        'recurrences',
        'achievements',
        'reviewedWeeks',
        'closedMonths',
      ].some((key) => !(key in parsed));
    const data = missing
      ? validateData({ ...emptyData(), ...parsed })
      : parseBackup(raw);
    return {
      data,
      warning: missing
        ? 'Dados locais incompletos: coleções ausentes foram recuperadas vazias. Exporte um backup antes de continuar.'
        : '',
      locked: false,
    };
  } catch {
    return {
      data: emptyData(),
      warning:
        'Não foi possível ler os dados locais. O conteúdo original foi preservado. Em Dados e backup, baixe uma cópia para recuperação e importe um backup válido.',
      locked: true,
    };
  }
}

export function readStorage(): LoadResult {
  try {
    return loadData(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {
      data: emptyData(),
      warning:
        'O armazenamento está indisponível. Habilite os dados de sites neste navegador para salvar suas alterações.',
      locked: true,
    };
  }
}

export function writeStorage(data: FinanceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateData(data)));
  } catch (error) {
    if (error instanceof DOMException)
      throw new Error(
        'Não foi possível salvar no navegador. O armazenamento pode estar cheio ou bloqueado. Exporte um backup e libere espaço.',
      );
    throw error;
  }
}
