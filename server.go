package main

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var db *sql.DB
var templates = template.New("")

func initializeDatabase() {
	var err error

	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))

	if err != nil {
		log.Fatalf("Error opening database: %q", err)
		panic(err)
	}

	err = db.Ping()
	if err != nil {
		log.Println("Error on ping: %q", err)
		panic(err)
	}

	log.Println("Succesfully connected to database.")
}

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

func renderTemplate(w http.ResponseWriter, tmpl string) {
	err := templates.ExecuteTemplate(w, tmpl+".html", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func mainHandler(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "index")
}

func submitHandler(w http.ResponseWriter, r *http.Request) {
	question := r.PostFormValue("question")
	desc1 := r.PostFormValue("desc1")
	desc2 := r.PostFormValue("desc2")
	log.Println(question)
	log.Println(desc1)
	log.Println(desc2)
}

func main() {
	initializeDatabase()
	result, err := db.Exec("CREATE TABLE Questions")
	if err != nil {
		log.Println("Failed")
		log.Println(err)
	}
	log.Println(result)

	addr, err := determinePort()
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Listening on port " + addr)

	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))
	templates = parseTemplates()

	http.HandleFunc("/", mainHandler)
	http.HandleFunc("/submit", submitHandler)

	if err := http.ListenAndServe(addr, nil); err != nil {
		panic(err)
	}
}
