# Publicar e verificar a aplicação

## Estado desta entrega

O build estático foi preparado para publicação. **Não há URL pública publicada por esta sessão.** O ambiente não oferece um serviço de hospedagem configurado para este projeto; iniciar um servidor local não cria uma URL acessível aos avaliadores. O código e o ZIP técnico foram enviados à branch `main` do repositório `joaosampaio22/BootCamp-2-`. A publicação do site pelo GitHub Pages ainda não foi ativada; o acesso à API do GitHub retornou `Forbidden` nesta sessão, enquanto o envio pelo Git funcionou.

Registre a URL real e a verificação em [ENTREGA.md](ENTREGA.md) depois de publicar. Não entregue um endereço `localhost`, de preview privado ou que peça acesso à sua conta.

## Opção principal: GitHub Pages com GitHub Actions

É necessário ter permissão no repositório e disponibilidade do GitHub Pages no seu plano. Para repositório público, o serviço normalmente está disponível gratuitamente. O projeto inclui o workflow `.github/workflows/pages.yml`, com execução **manual**, sem token no código.

1. Instale e valide localmente:

   ```sh
   npm ci
   npm test
   npm run build
   ```

2. Envie o código completo para a branch principal do seu repositório GitHub. Para o repositório originalmente vazio desta sessão, confira primeiro `git status` e a identidade de commit. Se a branch local ainda se chamar `work`, você pode criar a branch `main` com `git switch -c main` antes do primeiro commit. No seu computador, com autenticação GitHub configurada:

   ```sh
   git add .
   git commit -m "Adiciona Clareza Financeira e entrega do workshop"
   git push -u origin main
   ```

   Se você baixou somente o ZIP, pode criar um repositório e enviar os arquivos pela interface do GitHub ou clonar seu repositório e copiar os arquivos para ele. Inclua a pasta oculta `.github`. Não envie `node_modules`, segredos ou dados pessoais.

3. No GitHub, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Abra **Actions → Publicar Clareza Financeira → Run workflow**, selecione `main` e execute. A execução manual publica o conteúdo de `dist/` depois dos testes e do build.
5. Aguarde os jobs `build` e `deploy` terminarem com sucesso. Copie a URL do ambiente `github-pages` mostrada na execução. Em condições usuais, será `https://joaosampaio22.github.io/BootCamp-2-/`, mas **esse é apenas o formato esperado, não uma URL já validada**.
6. Faça a verificação pública descrita abaixo. Se a organização exigir aprovação do ambiente de implantação, cumpra o fluxo de aprovação do próprio GitHub.

O Vite usa `base: './'`. A aplicação não depende de rotas no servidor; as páginas são navegação interna em estado React. Isso permite servir a raiz ou uma subpasta do Pages sem regra especial de redirecionamento.

## Alternativa: upload de site estático

Se preferir um serviço com upload manual e plano gratuito disponível, como Netlify:

1. Execute `npm ci` e `npm run build`.
2. Entre no serviço pela sua própria conta. Escolha a criação de site por upload manual (na Netlify: **Add new project → Deploy manually**, ou equivalente da interface atual).
3. Envie a pasta **`dist`**, cujo nível principal deve conter `index.html`, `favicon.svg` e a pasta `assets`. Não envie o código-fonte como se fosse o build e não envie `node_modules`.
4. Copie a URL HTTPS final. Desative qualquer proteção que impeça os avaliadores de abrir o app sem login, conforme as opções e permissões da sua conta.
5. Para atualizar, gere outro build e envie novamente o conteúdo de `dist`.

Nenhuma dessas opções precisa de API paga ou token embutido na aplicação. Você pode fazer a publicação por interface autenticada.

## Verificação pública obrigatória

- Abra a URL HTTPS em janela anônima, sem login no provedor de hospedagem.
- Confirme que carregou a interface, não uma lista de arquivos, erro 404 ou página do repositório.
- Carregue a demonstração e confirme. O painel inicial fictício tem receitas de **R$ 6.650,00**, despesas de **R$ 2.693,40** e resultado de **R$ 3.956,60** no mês escolhido.
- Crie uma despesa fictícia de R$ 10,00 e confirme o recálculo para despesas de R$ 2.703,40.
- Recarregue e confirme a persistência **nessa mesma janela e origem**. Em navegação privada, os dados são temporários e podem sumir ao encerrar a sessão.
- Verifique em celular e computador; confirme uma previsão e teste exportação do backup.
- Copie a URL pública e a data real da verificação para `docs/ENTREGA.md`. Teste o acesso ao vídeo separadamente.

Dados do ambiente local não aparecem automaticamente no site publicado. Isso é esperado: o armazenamento é por origem. A demonstração é carregada em cada navegador pelo avaliador; nenhum dado financeiro é enviado à hospedagem.
