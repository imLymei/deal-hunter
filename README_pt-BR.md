# Deal Hunter

Deal Hunter é uma plataforma online de listas de desejos de jogos que busca as melhores ofertas em várias lojas virtuais usando a [API CheapShark](https://apidocs.cheapshark.com). Os usuários podem criar contas, pesquisar jogos, montar listas de desejos e compartilhá-las publicamente ou mantê-las privadas.

[English (EN)](./README.md)

## Arquitetura

![Diagrama de Arquitetura](./images/architecture.png)

## Requisitos

### Desenvolvedor

Para rodar o projeto localmente e fazer alterações no código:

- [Node.js 22 ou superior](https://nodejs.org)
- [pnpm](https://pnpm.io)

### Produção

Para implantar uma build de produção:

- [Docker](https://www.docker.com)

## Uso

### Desenvolvimento

1. Instale as dependências:

   ```bash
   pnpm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   pnpm dev
   ```

3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Produção

Compile e execute com Docker:

```bash
docker build -t deal-hunter .
docker run -p 3000:3000 deal-hunter
```

## Documentação da API

O backend fornece uma API REST documentada com Swagger/OpenAPI em `http://localhost:5000/openapi/swagger`.

### Principais Endpoints

| Método | Endpoint                             | Descrição                              |
| ------ | ------------------------------------ | -------------------------------------- |
| POST   | `/api/auth/register`                 | Criar conta                            |
| POST   | `/api/auth/login`                    | Autenticar usuário                     |
| GET    | `/api/users/me`                      | Obter perfil do usuário atual          |
| PUT    | `/api/users/me`                      | Atualizar usuário (nome, email, senha) |
| DELETE | `/api/users/me`                      | Excluir conta                          |
| GET    | `/api/wishlist/search?q=`            | Pesquisar jogos via CheapShark         |
| POST   | `/api/wishlist/`                     | Adicionar jogo à lista de desejos      |
| PUT    | `/api/wishlist/<id>`                 | Atualizar notas do item na lista       |
| DELETE | `/api/wishlist/<id>`                 | Remover da lista de desejos            |
| GET    | `/api/wishlist/game/<cheapshark_id>` | Obter ofertas e informações de preço   |

## API Externa — CheapShark

O Deal Hunter integra a [API CheapShark](https://www.cheapshark.com/api/1.0), um serviço público gratuito de agregação de ofertas de jogos que não requer cadastro nem chave de API.

### Endpoints Utilizados

| Endpoint                  | Finalidade                                                    |
| ------------------------- | ------------------------------------------------------------- |
| `GET /api/1.0/games`      | Pesquisar jogos por título                                    |
| `GET /api/1.0/games/<id>` | Obter detalhes do jogo com ofertas ativas e preços históricos |

### Fluxo de Dados

O backend faz proxy das requisições à CheapShark para não expor a API externa diretamente no frontend. As consultas de pesquisa de jogos são enviadas à CheapShark, os resultados são armazenados em cache na memória usando um `Map`, e o agregamento de ofertas (menor preço, todas as ofertas ativas, mínimo histórico) é calculado no servidor antes de ser retornado ao cliente.

[English (EN)](./README.md)
