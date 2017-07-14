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

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Posts (id serial PRIMARY KEY, Question varchar(255) NOT NULL, Desc1 varchar(255), Desc2 varchar(255), Image1 varchar(255) NOT NULL, Image2 varchar(255) NOT NULL)")
	checkError(err)

	// _, err = db.Exec("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2) VALUES ('question', 'desc1', 'desc2', 'image1', 'image2')")
	// checkError(err)
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
	question := "'" + r.PostFormValue("question") + "'"
	desc1 := "'" + r.PostFormValue("desc1") + "'"
	desc2 := "'" + r.PostFormValue("desc2") + "'"
	image1 := "'" + r.PostFormValue("image1") + "'"
	image2 := "'" + r.PostFormValue("image2") + "'"

	valueString := question + "," + desc1 + "," + desc2 + "," + image1 + "," + image2
	log.Println(valueString)

	res, err := db.Exec("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2) VALUES (" + valueString + ")")
	checkError(err)

	log.Println(res)

	// stmt, err := db.Prepare("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2) VALUES ($1, $2, $3, $4, $5)")
	// checkError(err)

	// res, err := stmt.Exec(question, desc1, desc2, image1, image2)
	// checkError(err)

	// id, err := res.LastInsertId()
	// checkError(err)

	// log.Println("LastInsertId: %q", id)
}

func main() {
	initializeDatabase()
	initializeTables()

	valueString := "'" + "hello" + "','" + "asdf" + "','" + "ajowef" + "','" + "jweiof" + "','" + "jowef" + "'"
	log.Println(valueString)

	res, err := db.Exec("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2) VALUES (" + valueString + ")")
	checkError(err)

	log.Println(res)

	// stmt, err := db.Prepare("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2) VALUES ($1, $2, $3, $4, $5)")
	// checkError(err)
	// log.Println("After Prepare")

	// res, err := stmt.Exec("asdf", "hello", "jiojw", "vawieop", "fjwfo")
	// checkError(err)
	// log.Println(res)

	// log.Println("After Exec")

	// id, err := res.LastInsertId()
	// checkError(err)

	// log.Println("LastInsertId: %q", id)

	// result, err := db.Query("SELECT * FROM Posts")
	// checkError(err)

	// for result.Next() {
	//     var id string
	//     var question string
	//     var desc1 string
	//     var desc2 string
	//     var image1 string
	//     var image2 string
	//     err = result.Scan(&id, &question, &desc1, &desc2, &image1, &image2)
	//     checkError(err)
	//     log.Println(id)
	//     log.Println(question)
	//     log.Println(desc1)
	//     log.Println(desc2)
	//     log.Println(image1)
	//     log.Println(image2)
	// }

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
