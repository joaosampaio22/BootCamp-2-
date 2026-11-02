# Validação real da entrega

Executada em 02/11/2026 nesta máquina de desenvolvimento. Versão de produção servida pelo Vite Preview; nenhuma URL pública foi testada. Navegador de teste: Chromium 154.0.8037.57 em Linux. Node.js 24.19.0 e npm 11.9.0.

## Resultados finais

| Verificação | Resultado observado |
| --- | --- |
| `npm ci --no-fund --no-audit` | Instalação limpa concluída com o lockfile entregue |
| `npm test` | **57 testes passaram; 0 falharam; 0 ignorados** |
| `npm run build` | **Passou**, incluindo TypeScript e arquivos de produção em `dist/` |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e` | **20 passaram; 0 falharam; 0 ignorados**, em 45,3 s nesta execução |
| Desktop | Chromium, viewport **1440 × 1050**, 10 cenários |
| Celular | Chromium com emulação Pixel 7, viewport **390 × 844**, 10 cenários |
| axe, regras `wcag2a`, `wcag2aa`, `wcag21aa` | **0 violações detectadas** em 12 estados por tamanho de tela: seis páginas preenchidas, painel vazio e cinco modais |

O build mostrou dois avisos sobre comentários `@__PURE__` dentro do Zod; o Rollup removeu essas anotações de comentários e concluiu a geração. Os avisos não foram escondidos: veja `testes/build-final.log`. O resultado não equivale a uma auditoria completa de segurança ou acessibilidade, nem a um teste em aparelhos físicos, Safari ou Firefox.

## O que os testes exercitaram

- Parsing de dinheiro, soma exata de centavos, valores inválidos e limites seguros.
- Totais por mês/ano, categorias, saldo negativo e recálculo após edição/exclusão.
- Orçamentos: combinação única de mês/categoria, limite de atenção de 80% exatos e excesso acima de 100%.
- Recorrências: meses com 28/29/30/31 dias, mudança de ano, início, pausa e previsões que não afetam gastos realizados.
- Confirmar pagamento uma vez por conta/mês, editar preservando o vínculo e excluir para reabrir a previsão.
- Backups: exportação/restauração integral, JSON/versão/campos inválidos, excesso de tamanho, duplicidades e relações órfãs.
- Dados locais ausentes/incompletos/corrompidos; falha de armazenamento e proteção contra substituição silenciosa.
- Conquistas por orçamento/conferências, sem prêmios por gastos repetidos; fechamento de mês futuro recusado.
- Fluxos reais de criar, editar e excluir receitas/despesas, recarregar a página e filtrar por mês/tipo/categoria.
- Confirmações de exclusão, demonstração e importação; cancelamento preservando registros; erro visível dentro do modal.
- Interface sem transbordamento horizontal da página nos tamanhos testados; foco inicial e Escape no diálogo.

## Relatórios e capturas

Os arquivos `testes/unit-final.json`, `testes/e2e-final.json`, `testes/axe-desktop-chromium.json`, `testes/axe-mobile-chromium.json` e os logs foram gerados pelos executores reais. `testes/e2e-inicial.json` preserva a primeira rodada com 12 sucessos e 4 falhas corrigidas. `testes/axe-inicial-desktop.json` preserva os problemas de contraste/ARIA antes da correção.

Capturas reais do build, carregado com exemplos fictícios:

- `capturas/painel-desktop-chromium.png`
- `capturas/painel-mobile-chromium.png`
- `capturas/recorrencias-desktop-chromium.png`
- `capturas/recorrencias-mobile-chromium.png`

A data do navegador foi fixada em 02/11/2026, 12h de São Paulo, somente nos testes. As imagens foram abertas e inspecionadas visualmente durante o desenvolvimento. Não foram produzidas por geração de imagens.

## Não realizado

Não houve gravação narrada, publicação do aplicativo como site, validação em nova tarefa restaurada a partir de snapshot nem envio do formulário. As pendências estão em `../ENTREGA.md`. O workflow de GitHub Pages foi preparado, mas não foi executado no GitHub nesta sessão.

## Pacote e ambiente reutilizável

O empacotador foi executado em uma pasta temporária: o ZIP tinha 49 arquivos, raiz única `ID_NAME`, CRC válido, o prompt preservado byte a byte e os arquivos necessários de fonte, testes, documentação e build. Não incluía `.git`, `node_modules` ou `.env`. Os caminhos do build são relativos, adequados a uma subpasta de hospedagem.

Essa cópia de entrega também foi instalada em uma pasta limpa com `npm ci --offline --no-fund --no-audit`, usando o cache já disponível nesta máquina. Nela, `npm test` passou com os mesmos 57 testes e `npm run build` concluiu. O usuário deve usar `npm ci` normal, com acesso ao npm; a opção offline não é um requisito do projeto.

Os campos `install_script` e `start_skill` foram salvos com sucesso no rascunho de configuração da nuvem. A instalação registra `npm ci`, testes e build; a inicialização usa o checkout existente e documenta o processo Vite, que precisa reiniciar em outra máquina. A revisão/salvamento e publicação desse ambiente cabem ao usuário nas configurações. Isso não publica o site nem comprova restauração em nova tarefa.

## Envio ao GitHub

Após solicitação do participante, `git push -u origin main` concluiu com sucesso e criou a branch remota `main`, incluindo código, documentação, capturas e `entrega/ID_NAME.zip`. A API do GitHub havia retornado `Forbidden`, mas o acesso de escrita pelo proxy Git funcionou. O envio do repositório não ativa automaticamente o site no GitHub Pages.
