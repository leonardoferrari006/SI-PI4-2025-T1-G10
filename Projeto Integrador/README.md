# TaNaMesa - Cardápio Digital

Este projeto é um protótipo de um aplicativo web de cardápio digital para restaurantes, desenvolvido como uma Single Page Application (SPA). Ele permite que os clientes visualizem o cardápio, façam pedidos e consultem sua conta diretamente da mesa, utilizando um QR Code ou inserindo o número da mesa.

## Funcionalidades Atuais

*   **Autenticação/Entrada**: Login por número da mesa (manual ou simulando leitura de QR Code) e nome do cliente.
*   **Visualização do Cardápio**: Exibição de itens categorizados (pratos, bebidas, lanches, sobremesas).
*   **Carrinho de Pedidos**: Adição, remoção e ajuste de quantidade de itens.
*   **Resumo da Conta**: Visualização dos itens pedidos e total.
*   **Navegação**: Entre as telas de "Menu", "Conta" e "Pedidos".
*   **Pagamento (protótipo)**: Uma tela separada para simulação de métodos de pagamento (Crédito, Débito, Pix, Pagar na Mesa).

## Tecnologias Utilizadas

*   **HTML5**
*   **Tailwind CSS**: Para estilização e responsividade.
*   **JavaScript (Vanilla JS)**: Para a lógica da SPA e gerenciamento de estado.

## Como Rodar Localmente

1.  Clone este repositório para o seu ambiente local.
2.  Abra o arquivo `index.html` em seu navegador web.
3.  Para a tela de pagamento de teste, abra `pagamentoTESTE.html`.

## Observações

Este é um protótipo focado no front-end. A persistência de dados e a comunicação com um backend real para processamento de pedidos e pagamentos não estão implementadas.
