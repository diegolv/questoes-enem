package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/")

	// Rota para listar provas
	if path == "exams" {
		if r.Method != http.MethodGet {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		serveJSON(w, "backend-go/data/exams.json")
		return
	}

	// Rota para detalhes da questão: exams/{year}/questions/{id}
	if strings.HasPrefix(path, "exams/") {
		parts := strings.Split(path, "/")
		if len(parts) == 4 && parts[2] == "questions" {
			year := parts[1]
			id := parts[3]
			filePath := filepath.Join("backend-go", "data", year, "questions", id, "details.json")
			serveJSON(w, filePath)
			return
		}
	}

	// Rota para arquivos estáticos: data/...
	if strings.HasPrefix(path, "data/") {
		filePath := filepath.Join("backend-go", path)
		serveFile(w, filePath)
		return
	}

	http.NotFound(w, r)
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

func serveFile(w http.ResponseWriter, filePath string) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Arquivo não encontrado", http.StatusNotFound)
		} else {
			http.Error(w, "Erro interno ao ler arquivo", http.StatusInternalServerError)
		}
		return
	}

	// Tentar inferir o Content-Type pela extensão
	ext := filepath.Ext(filePath)
	contentType := "application/octet-stream"
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".svg":
		contentType = "image/svg+xml"
	case ".json":
		contentType = "application/json"
	}

	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
