# Nota de integração

Este pacote reúne as cinco páginas do site Autonomia & Conforto.

- `index.html`: página inicial que já estava no projeto.
- `ajuda.html`: conteúdo baseado no arquivo enviado pela Beatriz; `css/ajuda.css` contém seus estilos complementares.
- `carrinho.html`: estrutura visual baseada nos arquivos enviados pelo Marcelo; `carrinho.css` preserva seus estilos e `js/carrinho.js` foi adaptado para compartilhar o catálogo e o armazenamento do site.
- `categorias.html` e `produto.html`: páginas do catálogo e detalhes anteriormente criadas para completar o projeto.
- `css/style.css`, `js/products.js`, `js/app.js` e `js/accessibility.js`: recursos compartilhados entre as páginas.

## Integração técnica do carrinho

O carrinho utiliza a chave `autonomia-conforto-cart-v1` e o mesmo formato de itens usado em `js/app.js` (`key`, `id`, `qty` e `size`). Dessa forma, os produtos adicionados na página inicial, no catálogo ou na página de detalhes aparecem na página `carrinho.html`.

A aplicação funciona como protótipo acadêmico com `localStorage`; não existe backend, banco de dados ou processamento de pagamentos.
