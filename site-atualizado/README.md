# Site de confirmação de presença

## Publicar no GitHub Pages
1. Extraia o ZIP e envie os três arquivos HTML e as pastas `css`, `js` e `assets` para a raiz de um repositório GitHub.
2. No repositório, acesse **Settings → Pages**.
3. Selecione **Deploy from a branch**, branch `main`, pasta `/ (root)` e salve.
4. A home ficará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`; o painel em `.../admin.html`.

O endpoint do Apps Script está configurado em `js/api.js`.

## Nome completo informado pelo convidado
A confirmação envia cada resposta em `respostas[]` com `convidadoId`, `resposta` e `nomeCompleto`. Esse último campo é separado do `nome` cadastrado pelo administrador. Para mostrar nomes na seção **Nomes completos**, o Apps Script precisa salvar `nomeCompleto` em coluna própria e devolvê-lo como `grupos[].convidados[].nomeCompleto` ou em `nomesCompletos[]`.

## Edição de convidados
O painel permite editar nome cadastrado, idade, categoria, gênero e bebida. Também permite editar o nome completo informado, quando o Apps Script devolve `nomeCompleto`. Os campos permanecem separados.

Para gravar edições, o Apps Script precisa aceitar o POST `updateGuest`. O contrato e a função para adicionar ao Apps Script estão em `apps-script-updateGuest-snippet.txt`, entregue fora do pacote público. A função atualiza o convidado existente por `convidadoId` e preserva a coluna `nomeCompleto` se essa propriedade não vier no payload.

## Arquivos incluídos
- `index.html`: página inicial.
- `confirmar.html`: confirmação por token de grupo.
- `admin.html`: painel administrativo.
- `css/`: estilos responsivos.
- `js/`: lógica do site e integração com o Apps Script.
- `assets/noite-estrelada.jpg`: imagem de fundo.

O código do Apps Script não acompanha o pacote público do site.
