# Autonomia & Conforto — Projeto Integrador

Site demonstrativo de e-commerce acessível, desenvolvido com HTML, CSS e JavaScript puro. O projeto apresenta roupas adaptativas e utensílios práticos para apoiar a autonomia no dia a dia.

## Páginas integradas

1. `index.html` — página inicial e apresentação do projeto.
2. `categorias.html` — catálogo com busca, filtros e ordenação.
3. `produto.html` — detalhes do produto selecionado.
4. `carrinho.html` — carrinho, quantidades, remoção, resumo demonstrativo e finalização simulada.
5. `ajuda.html` — central de ajuda, acessibilidade e perguntas frequentes.

## Estrutura principal

- `css/style.css` — estilo compartilhado das páginas principais.
- `css/ajuda.css` — estilos complementares da Central de Ajuda enviados pela integrante responsável.
- `carrinho.css` — estilos da página de carrinho enviados pelo integrante responsável.
- `js/products.js` — catálogo único dos cinco produtos demonstrativos.
- `js/app.js` — busca, navegação de catálogo e inclusão de produtos no carrinho nas páginas inicial, categorias e produto.
- `js/accessibility.js` — controles de acessibilidade compartilhados.
- `js/carrinho.js` — renderização e operações do carrinho, integrado ao mesmo catálogo e armazenamento das demais páginas.
- `assets/img/` — logotipo e imagens demonstrativas dos produtos.
- `favicon.svg` — ícone do site.

## Produtos cadastrados

- Camiseta adaptativa com velcro.
- Blusa adaptativa com ímãs.
- Kit de talheres ergonômicos.
- Abridor ergonômico multiuso.
- Apoio de alcance doméstico.

Os nomes, imagens e preços são ilustrativos e estão centralizados em `js/products.js`.

## Integração do carrinho

As páginas compartilham a chave `autonomia-conforto-cart-v1` no `localStorage` do navegador. Assim, os produtos adicionados na página inicial, no catálogo ou na página de detalhes ficam disponíveis no carrinho, sem backend ou banco de dados.

A página de carrinho também permite adicionar produtos para demonstração, alterar quantidades, remover itens, esvaziar o carrinho, simular um CEP e cupom, e concluir uma compra fictícia. Nenhuma compra, pagamento, frete ou pedido real é processado.

## Como testar localmente

1. Extraia o ZIP.
2. Abra a pasta do projeto em um terminal.
3. Execute:

```bash
python -m http.server 8000
```

4. Acesse `http://localhost:8000`.

Para testar em um celular na mesma rede Wi-Fi, execute o servidor vinculando todas as interfaces:

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Depois, abra no celular `http://IP-DO-COMPUTADOR:8000` (substitua pelo IPv4 exibido pelo comando `ipconfig` no Windows).

## Publicação no GitHub Pages

No repositório, acesse **Settings → Pages** e escolha:
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/(root)`

O arquivo `index.html` está na raiz do projeto.

## Observação acadêmica

Este site é um protótipo demonstrativo para o Projeto Integrador. Não possui servidor, banco de dados, cadastro de usuários, integração com transportadoras ou gateway de pagamento.
