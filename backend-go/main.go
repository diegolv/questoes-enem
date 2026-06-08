package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	mux := http.NewServeMux()

	// Rota para listar provas
	mux.HandleFunc("/exams", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		serveJSON(w, "data/exams.json")
	})

	// Rota para detalhes da questão: /exams/{year}/questions/{id}
	mux.HandleFunc("/exams/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}

		// Parse manual do path: /exams/{year}/questions/{id}
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 4 || parts[2] != "questions" {
			http.NotFound(w, r)
			return
		}

		year := parts[1]
		id := parts[3]
		filePath := filepath.Join("data", year, "questions", id, "details.json")

		serveJSON(w, filePath)
	})

	// Servir arquivos estáticos (imagens, etc) que estão nas pastas de questões
	// Exemplo: /data/2023/questions/10/imagem.png
	fileServer := http.FileServer(http.Dir("data"))
	mux.Handle("/data/", http.StripPrefix("/data/", fileServer))

	port := ":8081"
	fmt.Printf("Servidor rodando em http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}

func serveJSON(w http.ResponseWriter, filePath string) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Recurso não encontrado", http.StatusNotFound)
		} else {
			http.Error(w, "Erro interno do servidor", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

type ErrorResponse struct {
	Error string `json:"error"`
}
