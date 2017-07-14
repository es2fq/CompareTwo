package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/lib/pq"
	"html/template"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

var db *sql.DB
var templates = template.New("")

type Post struct {
	id       string
	question string
	desc1    string
	desc2    string
	image1   string
	image2   string
}

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

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Posts (id serial PRIMARY KEY, Question varchar(255) NOT NULL, Desc1 varchar(255), Desc2 varchar(255), Image1 text NOT NULL, Image2 text NOT NULL)")
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
	image1 := r.PostFormValue("image1")
	image2 := r.PostFormValue("image2")

	stmt, err := db.Prepare("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2) VALUES ($1, $2, $3, $4, $5)")
	checkError(err)

	res, err := stmt.Exec(question, desc1, desc2, image1, image2)
	checkError(err)
	log.Println(res)
}

func getPostHandler(w http.ResponseWriter, r *http.Request) {
	res, err := db.Query("SELECT COUNT(*) FROM Posts")
	checkError(err)

	count := checkCount(res)
	randIndex := rand.Intn(count)
	log.Println(randIndex)

	res, err = db.Query("SELECT * FROM Posts where id=" + strconv.Itoa(randIndex))
	checkError(err)

	var id string
	var question string
	var desc1 string
	var desc2 string
	var image1 string
	var image2 string

	for res.Next() {
		err = res.Scan(&id, &question, &desc1, &desc2, &image1, &image2)
		checkError(err)
	}

	log.Println(id, question, desc1, desc2)

	post := &Post{id: id, question: question, desc1: desc1, desc2: desc2, image1: image1, image2: image2}
	data, err := json.Marshal(post)
	checkError(err)
	log.Println(data)

	w.Write(question, desc1, desc2)
}

func checkCount(rows *sql.Rows) (count int) {
	for rows.Next() {
		err := rows.Scan(&count)
		checkError(err)
	}
	return count
}

func main() {
	initializeDatabase()
	initializeTables()

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
	http.HandleFunc("/getpost", getPostHandler)

	if err := http.ListenAndServe(addr, nil); err != nil {
		panic(err)
	}
}

func checkError(err error) {
	if err != nil {
		log.Println(err)
	}
}
