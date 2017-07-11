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

func initializeTables() {
	var err error

	db.Exec("DROP TABLE Questions")
	db.Exec("DROP TABLE Desc1")
	db.Exec("DROP TABLE Desc2")
	db.Exec("DROP TABLE Image1")
	db.Exec("DROP TABLE Image2")

	// _, err = db.Exec("CREATE TABLE IF NOT EXISTS Questions (id INT NOT NULL, PRIMARY KEY (id), data varchar(32) NOT NULL)")
	// checkError(err)
	// _, err = db.Exec("CREATE TABLE IF NOT EXISTS Desc1 (id INT NOT NULL, PRIMARY KEY (id), data varchar(32))")
	// checkError(err)
	// _, err = db.Exec("CREATE TABLE IF NOT EXISTS Desc2 (id INT NOT NULL, PRIMARY KEY (id), data varchar(32))")
	// checkError(err)
	// _, err = db.Exec("CREATE TABLE IF NOT EXISTS Image1 (id INT NOT NULL, PRIMARY KEY (id), data varchar(32) NOT NULL)")
	// checkError(err)
	// _, err = db.Exec("CREATE TABLE IF NOT EXISTS Image2 (id INT NOT NULL, PRIMARY KEY (id), data varchar(32) NOT NULL)")
	// checkError(err)

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Posts (id INT NOT NULL AUTO_INCREMENT, Question varchar(255) NOT NULL, Desc1 varchar(255), Desc2 varchar(255), Image1 varchar(255) NOT NULL, Image2 varchar(255) NOT NULL)")
	checkError(err)
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
	initializeTables()

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

func checkError(err error) {
	if err != nil {
		log.Println(err)
	}
}
