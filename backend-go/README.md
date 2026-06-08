# ENEM API - Backend Go

Este é um backend simples e independente construído em Go para servir as questões do ENEM a partir de arquivos JSON.

## Estrutura de Pastas

- `main.go`: O servidor web.
- `data/`: Contém todos os arquivos JSON e imagens das questões (copiados do projeto original).
- `go.mod`: Definição do módulo Go.

## Como Executar

Certifique-se de ter o Go instalado em sua máquina.

1. Entre na pasta:
   ```bash
   cd backend-go
   ```

2. Execute o servidor:
   ```bash
   go run main.go
   ```

O servidor estará rodando em `http://localhost:8081`.

## Endpoints

- `GET /exams`: Lista todas as edições do ENEM disponíveis.
- `GET /exams/{ano}/questions/{id}`: Retorna os detalhes de uma questão específica, incluindo a resposta correta.
- `GET /data/...`: Serve arquivos estáticos como imagens das questões.

## Independência

Este projeto é totalmente independente do frontend em Next.js e do banco de dados Prisma. Você pode mover esta pasta `backend-go` para qualquer outro lugar e ela continuará funcionando, desde que a pasta `data` esteja presente no mesmo diretório que o executável/código.
