# Projeto: Clareza Financeira

## Problema, objetivo e público

Uma pessoa que anota gastos em lugares diferentes tem dificuldade para responder quanto entrou e saiu no mês, em quais categorias gastou e quais contas já estão previstas. O Clareza Financeira reúne essas informações em uma aplicação pequena, verificável no navegador e adequada a uma apresentação de workshop.

O público é uma pessoa que quer organizar receitas e despesas pessoais sem conectar contas bancárias. O objetivo é tornar registros e previsões compreensíveis, sem aconselhamento financeiro. Investimentos, compartilhamento entre usuários e serviços externos estão fora do escopo.

## Tecnologia e estrutura

- React e TypeScript para interface e tipos; Vite para desenvolvimento/build estático.
- `localStorage` para persistência; chave `clareza-financeira:v1`.
- Zod para validar registros e backups; Lucide para ícones locais ao bundle.
- Vitest para regras e cálculos; Playwright para fluxos reais em Chromium.
- CSS responsivo, fontes do sistema e gráfico CSS com legenda textual. Não há fonte, imagem ou gráfico carregado de CDN.

| Arquivo | Responsabilidade |
| --- | --- |
| `src/domain.ts` | Centavos, calendário, totais, limites, previsões, pagamentos, conquistas, esquemas e exemplos |
| `src/storage.ts` | Leitura protegida, recuperação parcial e gravação validada |
| `src/App.tsx` | Estado, navegação, operações, confirmações e sincronização entre abas |
| `src/views.tsx` | Painel e páginas de cada função |
| `src/forms.tsx` | Formulários com validação e mensagens |
| `src/ui.tsx` | Janela modal acessível, ícones e estados vazios |
| `src/styles.css` | Layout, componentes e adaptação a telas menores |
| `src/domain.test.ts` / `tests/app.spec.ts` | Testes automatizados |

A IA generativa participou da escrita, revisão e verificação do código. Essa participação está documentada em `docs/evidencias/`. O produto não envia dados a modelos nem contém um assistente de IA.

## Regras de negócio

### Valores e lançamentos

Todos os valores são inteiros positivos em centavos, de R$ 0,01 até R$ 1.000.000,00 por registro. O tipo receita/despesa define o sinal nos resumos. A conversão de texto separa reais e centavos; não multiplica um número decimal de ponto flutuante para obter centavos. Use `120,50`, `120.50` ou `1.234,56`, sem mais de duas casas decimais.

Data e mês são strings locais (`AAAA-MM-DD` e `AAAA-MM`), sem conversão de fuso para agrupar lançamentos. Datas impossíveis são recusadas. O painel mostra apenas os lançamentos do mês escolhido, inclusive quando o saldo é negativo. Descrição tem de 1 a 100 caracteres úteis e a categoria deve corresponder ao tipo. Excluir um registro pede confirmação. Não há bloqueio para datas futuras: se o usuário cadastrar um lançamento futuro manualmente, ele será tratado como realizado naquele mês. Para previsões, use Contas recorrentes.

O limite de navegação é janeiro de 1900 a outubro de 2199, garantindo a janela de três meses dentro do calendário suportado. O seletor de mês do topo vale para todas as páginas. Os filtros de tipo e categoria valem para a lista de lançamentos, não alteram os números gerais do painel.

### Orçamentos

Um limite por categoria de despesa por mês. Salvar de novo a mesma combinação substitui o limite. Outros meses têm limites independentes. Gasto realizado dividido pelo limite mostra o percentual. A comparação usa inteiros: a partir de **80% exatos**, estado de atenção; acima de **100%**, excesso. A porcentagem exibida é arredondada, podendo mostrar 80% quando o valor exato ainda está ligeiramente abaixo disso. Excluir o orçamento não exclui despesas. O limite é uma escolha do usuário, não uma recomendação financeira.

### Recorrências e pagamentos

Cada conta tem descrição, valor, categoria de despesa, dia de vencimento (1–31), mês inicial e estado ativo/pausado. Periodicidade exclusivamente mensal. Se não existir o dia escolhido, vence no último dia do mês, inclusive fevereiro bissexto. A janela de previsão inclui **o mês selecionado e os dois seguintes**.

Uma previsão não afeta os totais e orçamentos. Confirmar um pagamento cria uma despesa com o valor da conta, a data de vencimento e o par `(recurrenceId, occurrenceMonth)`. O domínio e o importador rejeitam dois pagamentos para o mesmo par. A confirmação no app é somente um registro, nunca uma operação bancária.

O pagamento pode ser editado, mas seu tipo, vínculo e mês são preservados. É possível ajustar a data dentro daquele mês. Excluir o pagamento reabre a previsão (desde que a conta esteja ativa). Pausar remove previsões não pagas em toda a janela, preservando pagamentos existentes; reativar volta a gerar previsões a partir do mês inicial. Para mudar os parâmetros de uma conta, pause a antiga e cadastre outra com mês inicial apropriado; contas não têm edição/exclusão física nesta versão.

### Conquistas

Três reconhecimentos, sem pontuação: criar o primeiro orçamento; conferir a semana (segunda a domingo da semana atual do navegador); concluir a conferência de um fechamento atual/passado. Cadastrar ou repetir gastos não dá conquistas. Não é obrigatório usar essa área para organizar as finanças. Repetir uma conferência não duplica conquistas. O conjunto demonstrativo já inclui a conquista do primeiro orçamento porque contém limites cadastrados.

O fechamento registra que o usuário conferiu o mês; não bloqueia nem congela valores. Após alterações, os totais se atualizam e uma nova conferência é recomendada. Meses futuros não podem ser fechados.

### Backup, integridade e dados incompletos

O JSON v1 contém `transactions`, `budgets`, `recurrences`, `achievements`, `reviewedWeeks` e `closedMonths`. Importar é uma substituição integral, nunca uma mesclagem. O limite é 5 MB; o app valida versão, formato, datas, valores, categorias, IDs únicos, relações e pagamentos duplicados antes de pedir confirmação. Arquivos inválidos não alteram os dados existentes.

Para armazenamento local v1 incompleto, somente coleções ausentes são inicializadas vazias, com aviso; registros existentes inválidos não são descartados silenciosamente. Conteúdo ilegível permanece no armazenamento original e bloqueia alterações comuns. A área de dados permite baixar uma cópia bruta para recuperação, restaurar um backup, carregar demonstração ou apagar os dados com confirmação explícita.

Se a gravação falhar por quota/permissão, o app informa o erro e não mostra a alteração como salva. Atualizações de outra aba recarregam o estado e fecham formulários; uma comparação antes de salvar evita sobrescrever uma versão externa ainda não processada. Isso reduz conflitos, mas não substitui um banco transacional com concorrência entre usuários.

## Segurança, limitações e verificabilidade

Não há API, autenticação, backend, integração bancária, código de LLM, telemetria ou serviços pagos. Os dados ficam no navegador, com o isolamento de origem que ele oferece. O app não criptografa registros/backups nem oferece proteção contra acesso ao dispositivo. Não use dados sensíveis na apresentação. As descrições são renderizadas como texto pelo React, sem HTML arbitrário.

O armazenamento limita-se a até 10 mil lançamentos, 10 mil orçamentos e mil contas, com limites próprios para conferências. Sem login ou sincronização, a restauração entre dispositivos é manual via JSON. A hospedagem estática continua necessária para carregar o app; esta versão não é uma PWA com funcionamento offline garantido.

Para verificação: carregar demonstração, criar/editar/excluir um lançamento, conferir o painel, alterar um orçamento, confirmar uma conta e restaurar um backup. Os comandos completos estão no README; resultados reais e capturas ficam em `docs/evidencias/`.
