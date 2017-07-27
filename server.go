package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/lib/pq"
	"html/template"
	"io/ioutil"
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
	Id       string
	Question string
	Desc1    string
	Desc2    string
	Image1   string
	Image2   string
	Votes1   string
	Votes2   string
	Date     string
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

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Posts (id serial PRIMARY KEY, Question varchar(255) NOT NULL, Desc1 varchar(255), Desc2 varchar(255), Image1 text NOT NULL, Image2 text NOT NULL, Votes1 int, Votes2 int, Date varchar(255))")
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
	date := r.PostFormValue("date")
	id := r.PostFormValue("id")
	votes1 := 0
	votes2 := 0

	stmt, err := db.Prepare("INSERT INTO Posts (Question, Desc1, Desc2, Image1, Image2, Date, Votes1, Votes2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)")
	checkError(err)

	res, err := stmt.Exec(question, desc1, desc2, image1, image2, date, votes1, votes2)
	checkError(err)
	log.Println(res)

	writePostToFile(question, id)
}

func writePostToFile(question string, id string) {
	nextId, err := strconv.Atoi(id)
	nextId += 1
	checkError(err)

	post := question + "," + strconv.Itoa(nextId) + "\n"
	log.Println(post)

	// if _, err := os.Stat("posts.txt"); os.IsNotExist(err) {
	//     log.Println("File does not exist")
	// }

	f, err := os.Create("posts.txt")
	checkError(err)

	defer f.Close()

	_, err = f.WriteString(post)
	checkError(err)

	f.Sync()
}

func readPostsFileHandler(w http.ResponseWriter, r *http.Request) {
	text, err := ioutil.ReadFile("posts.txt")
	checkError(err)
	log.Println(string(text))

	w.Write(text)
}

func getPostHandler(w http.ResponseWriter, r *http.Request) {
	res, err := db.Query("SELECT COUNT(*) FROM Posts")
	checkError(err)

	count := checkCount(res)
	randIndex := rand.Intn(count) + 1

	res, err = db.Query("SELECT * FROM Posts where id=" + strconv.Itoa(randIndex))
	checkError(err)

	var id string
	var question string
	var desc1 string
	var desc2 string
	var image1 string
	var image2 string
	var date string
	var votes1 string
	var votes2 string

	for res.Next() {
		err = res.Scan(&id, &question, &desc1, &desc2, &image1, &image2, &date, &votes1, &votes2)
		checkError(err)
	}

	post := &Post{Id: id, Question: question, Desc1: desc1, Desc2: desc2, Image1: image1, Image2: image2, Date: date, Votes1: votes1, Votes2: votes2}
	data, err := json.Marshal(post)
	checkError(err)

	w.Write(data)
}

func getPostCountHandler(w http.ResponseWriter, r *http.Request) {
	res, err := db.Query("SELECT COUNT(*) FROM Posts")
	checkError(err)

	count := checkCount(res)

	data, err := json.Marshal(count)
	checkError(err)

	w.Write(data)
}

func checkCount(rows *sql.Rows) (count int) {
	for rows.Next() {
		err := rows.Scan(&count)
		checkError(err)
	}
	return count
}

func getPostByRowNumber(w http.ResponseWriter, r *http.Request) {
	rowNum, err := strconv.Atoi(r.PostFormValue("row"))
	checkError(err)

	res, err := db.Query("SELECT * FROM Posts LIMIT " + "1" + " OFFSET " + strconv.Itoa(rowNum-1))
	checkError(err)

	var id string
	var question string
	var desc1 string
	var desc2 string
	var image1 string
	var image2 string
	var date string
	var votes1 string
	var votes2 string

	for res.Next() {
		err = res.Scan(&id, &question, &desc1, &desc2, &image1, &image2, &date, &votes1, &votes2)
		checkError(err)
	}

	post := &Post{Id: id, Question: question, Desc1: desc1, Desc2: desc2, Image1: image1, Image2: image2, Date: date, Votes1: votes1, Votes2: votes2}
	data, err := json.Marshal(post)
	checkError(err)

	w.Write(data)
}

func incrementVoteHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PostFormValue("id")
	imageNum := r.PostFormValue("imageNum")

	columnName := "votes" + imageNum

	stmt, err := db.Prepare("UPDATE Posts SET " + columnName + "=" + columnName + "+1 WHERE id=$1")
	checkError(err)

	res, err := stmt.Exec(id)
	checkError(err)
	log.Println(res)
}

func main() {
	initializeDatabase()
	initializeTables()

	result, err := db.Query("SELECT * FROM Posts")
	checkError(err)

	for result.Next() {
		var id string
		var question string
		var desc1 string
		var desc2 string
		var image1 string
		var image2 string
		var date string
		var votes1 string
		var votes2 string
		err = result.Scan(&id, &question, &desc1, &desc2, &image1, &image2, &date, &votes1, &votes2)
		checkError(err)
		log.Println(id, question, votes1, votes2)
	}

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
	http.HandleFunc("/getpostcount", getPostCountHandler)
	http.HandleFunc("/getpostbyrownumber", getPostByRowNumber)
	http.HandleFunc("/incrementvote", incrementVoteHandler)
	http.HandleFunc("/readpostsfile", readPostsFileHandler)

	if err := http.ListenAndServe(addr, nil); err != nil {
		panic(err)
	}
}

func checkError(err error) {
	if err != nil {
		log.Println(err)
	}
}
