# Clareza Financeira

Aplicação de finanças pessoais criada com ajuda de IA generativa para um workshop. Interface em português brasileiro, dados fictícios de demonstração e armazenamento no navegador. **Não há LLM no aplicativo, API paga, token, backend, integração bancária ou banco de dados externo.**

## Baixar o projeto

O código e o pacote técnico estão no repositório `joaosampaio22/BootCamp-2-`, branch `main`.

[Baixar ID_NAME.zip pelo GitHub](https://github.com/joaosampaio22/BootCamp-2-/raw/refs/heads/main/entrega/ID_NAME.zip). Se o download direto não abrir, acesse a pasta `entrega`, abra `ID_NAME.zip` e clique em **Download raw**. Em repositório privado, entre na conta com acesso.

O site ainda precisa ser ativado no GitHub Pages, conforme `docs/PUBLICACAO.md`. O vídeo narrado e os dados finais da submissão continuam pendentes.

## Executar no computador

Instale **Node.js 22.12 ou superior** (recomendado: versão LTS). Na pasta que contém `package.json`:

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite no terminal (normalmente `http://localhost:5173`). Para encerrar, pressione Ctrl+C. Não abra `index.html` diretamente pelo explorador de arquivos.

1. Clique em **Experimentar demonstração** e confirme. Todos os exemplos são inventados.
2. Escolha o mês no topo. Os dados de exemplo usam o mês selecionado.
3. Explore Lançamentos, Orçamentos, Contas recorrentes e Conquistas.
4. Em Dados e backup, exporte o JSON antes de substituir ou apagar dados.

## Testar e gerar a versão estática

```sh
npm test
npm run build
npm run preview
```

O build está em `dist/`. O preview normalmente usa `http://localhost:4173`. O comando de build inclui a verificação TypeScript. **`npm run preview` é uma verificação local, não uma publicação pública.**

Testes completos no navegador, opcionais para executar o app:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Em Linux, se faltarem bibliotecas do navegador, use `npx playwright install --with-deps chromium` com as permissões adequadas do sistema. Para usar um Chromium já instalado: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e` (Linux/macOS). No PowerShell, defina `$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE` com o caminho do executável antes do comando. A variável é opcional e não é um segredo.

## O que está incluído

- Criar, editar, excluir e filtrar receitas/despesas; exclusão exige confirmação.
- Painel mensal, categorias e últimos lançamentos, calculados em centavos inteiros.
- Limites mensais por categoria com atenção a partir de 80% e excesso acima de 100%.
- Contas mensais com previsões para o mês selecionado e os dois seguintes; pagamentos manuais sem duplicidade por conta/mês.
- Exportar e restaurar backups JSON validados, com confirmação antes da substituição.
- Demonstração inteiramente fictícia, conferência semanal e fechamento mensal com três conquistas discretas.
- Layout para celular/computador, navegação por teclado, mensagens de erro e recuperação de dados locais inválidos.

## Documentação e entrega

| Material | Local |
| --- | --- |
| Problema, público, arquitetura e regras | [docs/PROJETO.md](docs/PROJETO.md) |
| Passos para publicar um site estático | [docs/PUBLICACAO.md](docs/PUBLICACAO.md) |
| Roteiro de vídeo narrado | [docs/ROTEIRO-VIDEO.md](docs/ROTEIRO-VIDEO.md) |
| Pendências, ID, nome, vídeo, URL e formulário | [docs/ENTREGA.md](docs/ENTREGA.md) |
| Prompt original, decisões, erros e testes reais | [docs/evidencias/README.md](docs/evidencias/README.md) |
| Capturas reais da aplicação | `docs/evidencias/capturas/` |

Para gerar o pacote com Python 3 (somente o empacotador usa Python):

```sh
npm run build
python3 scripts/package_workshop.py
```

Isso cria `delivery/ID_NAME/` e `delivery/ID_NAME.zip`, incluindo fonte, documentação e `dist/`, sem `node_modules`, `.git`, segredos ou caches. No Windows, use `py -3` no lugar de `python3` se necessário. Para seu pacote final:

```sh
python3 scripts/package_workshop.py --id SEU_ID --name SEU_NOME
```

Também é possível copiar os mesmos materiais para uma pasta `SEU_ID_SEU_NOME` e compactá-la pelo sistema operacional. **O ZIP técnico não equivale a uma submissão completa:** registre uma URL pública verificada, grave o vídeo narrado, substitua ID/nome e confira prazo/formulário com Talent Development.

## Limitações essenciais

Os dados pertencem ao navegador e à origem (protocolo, domínio e porta). Outro computador ou endereço tem outro armazenamento. Limpar os dados do site pode apagá-los. Backups JSON não têm criptografia. Não há sincronização, autenticação, notificações ou pagamentos reais. Sem service worker, abrir a página pela primeira vez exige acesso à hospedagem; não há garantia de uso offline após fechar o navegador. Na demonstração e no vídeo, use somente dados fictícios, sem informações da TCS, de clientes ou credenciais.
