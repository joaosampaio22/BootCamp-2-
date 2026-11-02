# Processo de desenvolvimento com IA

Registro desta sessão, em 02/11/2026. A IA recebeu o texto preservado em `01-prompt-original.txt`, inspecionou o ambiente e escreveu o projeto no checkout `BootCamp-2-`. No início, o repositório não tinha commits, código nem dependências. A nova solicitação autorizou a criação do aplicativo, depois da inspeção inicial do ambiente.

## Decisões tomadas com ajuda da IA

1. **Arquitetura pequena:** React + TypeScript + Vite, sem backend ou serviços externos, conforme o pedido. O estado financeiro é separado das telas em `src/domain.ts` para que as regras possam ser testadas sem navegador.
2. **Centavos inteiros:** parsing de texto decimal por partes e somas de inteiros. Evita o erro clássico de representar valores como 0,1 + 0,2 em ponto flutuante e usar esse resultado como dinheiro.
3. **Datas locais e vencimento no fim do mês:** strings de data para filtros mensais e ajuste do dia 31 para fevereiro/meses de 30 dias. A janela foi definida explicitamente como mês selecionado + dois seguintes.
4. **Pagamentos vinculados:** um par conta/mês identifica a ocorrência, validado no cadastro e na importação. Não há geração automática de despesas. Pausar preserva pagamentos existentes.
5. **Persistência com validação:** estruturas e relações verificadas por Zod; restauração/demonstração pedem confirmação. Conteúdo local inválido é preservado para recuperação em vez de ser trocado silenciosamente por dados vazios.
6. **Interface:** navegação lateral no computador, navegação compacta no celular, cartões de resumo, gráfico com legenda textual e previsões claramente diferenciadas. Fontes do sistema e ícones no bundle evitam dependências visuais externas.
7. **Conquistas discretas:** somente primeiro orçamento, revisão semanal e fechamento; sem pontos por gastos ou repetição. Conquistas não bloqueiam funções financeiras.
8. **Entrega reproduzível:** lockfile npm, testes, build estático, instruções de publicação, roteiro de vídeo e empacotador que exclui dependências, Git e segredos.

## Partes relevantes do código criadas/revisadas com IA

O agente gerou e revisou os arquivos de código, estilos, testes e documentação desta entrega. Os exemplos abaixo existem no código; não são respostas de outra conversa.

### Conversão monetária — `src/domain.ts`, `parseMoney`

```ts
const [units, fraction = ''] = value.split('.');
const cents = Number(units) * 100 + Number(fraction.padEnd(2, '0'));
```

O código completo valida sintaxe, limite e inteiro seguro antes de usar o resultado. Os testes verificam centavos, números formatados e entradas inválidas.

### Prevenção de duplicidade — `confirmPayment`

```ts
if (data.transactions.some(t =>
  t.recurrenceId === recurrenceId && t.occurrenceMonth === month
)) throw new Error('Essa conta já foi paga neste mês.');
```

O esquema do backup verifica a mesma unicidade, impedindo que a restauração introduza dois pagamentos para o mesmo par. Excluir uma despesa vinculada reabre sua previsão.

### Alertas de orçamento — `budgetUsage`

```ts
const status = spent > budget.limitCents ? 'exceeded'
  : spent * 100 >= budget.limitCents * 80 ? 'near' : 'ok';
```

A decisão usa inteiros, não o percentual arredondado exibido na tela. Há teste específico para R$ 79,99 de R$ 100,00.

### Acessibilidade de modal — `src/ui.tsx`

Após abrir o diálogo nativo com `showModal()`, o foco é direcionado ao primeiro campo habilitado. O navegador mantém a navegação dentro da janela; Escape permite fechá-la. O foco inicial foi corrigido após uma falha real do teste E2E.

## Erros reais encontrados durante a sessão

| Observação real | Diagnóstico e correção |
| --- | --- |
| A primeira tentativa de build falhou com `[vite:css] [postcss] ENOENT ... 'data:text/css,'` | Havia uma importação CSS vazia e desnecessária. A linha foi removida; o build passou dessa etapa. Não foi uma falha de instalação. |
| O build seguinte apontou `TS2345` no teste de valores inválidos | O TypeScript inferiu `categoryId` como `string` no array de casos. A lista passou a ter tipo explícito `Partial<Transaction>[]`, preservando os casos inválidos para a validação em execução. |
| Primeira rodada E2E: 12 passaram, 4 falharam | Dois problemas se repetiram nos dois tamanhos de tela: o seletor de teste por rótulo exato dos filtros não os encontrava, e o foco inicial do modal não estava na descrição. Foram adicionados nomes acessíveis explícitos aos filtros e foco após `showModal()`. O relatório original está em `testes/e2e-inicial.json`. |
| A captura mostrou o controle de mês nativo em inglês no Chromium do ambiente | O texto visível do seletor passou a usar `Intl.DateTimeFormat('pt-BR')`, mantendo o campo nativo para escolher mês e a navegação anterior/próximo. |
| A primeira análise com axe detectou `color-contrast` e `aria-prohibited-attr` | Textos secundários foram escurecidos e o marcador visual com `aria-label` recebeu um papel semântico compatível. A análise ampliada também identificou um texto com baixo contraste no estado vazio, que foi corrigido. Nenhuma regra do verificador foi desativada. O relatório inicial está em `testes/axe-inicial-desktop.json`. |
| A revisão identificou que uma mensagem global de falha poderia ficar fora da camada do diálogo nativo | Erros de gravação passaram a aparecer dentro do próprio modal. O teste com dados locais corrompidos verifica que a mensagem é visível no diálogo e que o conteúdo original não foi substituído. |

Outras correções identificadas na verificação de acessibilidade, se presentes, estão descritas no relatório final de validação. Não foram fabricados erros de cálculo, conversas ou resultados de testes. Os relatórios finais registram o estado efetivamente executado depois das correções.

## Papel do participante e pendências

O participante precisa revisar o projeto, gravar e narrar a demonstração, publicar a URL, substituir os marcadores de ID/nome e enviar o ZIP pelo formulário no prazo oficial. Não foi realizada publicação ou submissão automática. A aplicação usa IA como ferramenta de desenvolvimento; não contém LLM em execução.
