package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type Page struct {
	Title string
}

var templates = template.New("")

func determinePort() (string, error) {
	port := os.Getenv("PORT")
	if port == "" {
		return "", fmt.Errorf("$PORT not set")
	}
	return ":" + port, nil
}

func parseTemplates() *template.Template {
	templ := template.New("")
	err := filepath.Walk("./html", func(path string, info os.FileInfo, err error) error {
		if strings.Contains(path, ".html") {
			_, err = templ.ParseFiles(path)
			if err != nil {
				fmt.Printf("Error parsing html: %q", err)
			}
		}
		return err
	})
	if err != nil {
		panic(err)
	}
	return templ
}

func mainHandler(w http.ResponseWriter, r *http.Request) {
	p := Page{Title: "hi"}
	renderTemplate(w, "index", p)
}

func renderTemplate(w http.ResponseWriter, tmpl string, p Page) {
	err := templates.ExecuteTemplate(w, tmpl+".html", p)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func main() {
	addr, err := determinePort()
	if err != nil {
		log.Fatal(err)
	}
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	templates = parseTemplates()
	http.HandleFunc("/", mainHandler)
	if err := http.ListenAndServe(addr, nil); err != nil {
		panic(err)
	}
}
