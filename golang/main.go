package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

// Assuming you have a User struct that represents the user data
type User struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	ProfileURL string `json:"profileUrl"`
	Photos    []Photo `json:"photos"`
}

type Photo struct {
	Value string `json:"value"`
}

var (
	client           *mongo.Client
	oauthConfig      *oauth2.Config
	oauthStateString = "random"
	// Example in-memory store for simplicity
	// In a real application, you'd store this in a session or database
	store = sessions.NewCookieStore([]byte("your-secret-key")) // Replace "your-secret-key" with a strong key
)


func connectDB() {
	uri := os.Getenv("DB_URI")
	var err error
	client, err = mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
}

func userDataHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("Checking user session")
    session, _ := store.Get(r, "session-name")
    if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
        fmt.Println("User not authenticated")
        http.Error(w, "User not authenticated", http.StatusUnauthorized)
        return
    }

    fmt.Println("User is authenticated")
    // Proceed with handling the request...
}

func setupOAuth() {
	oauthConfig = &oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		Scopes:       []string{"read:user"},
		Endpoint:     github.Endpoint,
		RedirectURL:  "http://localhost:3000/auth/github/callback",
	}
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, world!")
}

func githubLogin(w http.ResponseWriter, r *http.Request) {
	url := oauthConfig.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func githubCallback(w http.ResponseWriter, r *http.Request) {
    state := r.FormValue("state")
    if state != oauthStateString {
        fmt.Printf("invalid oauth state, expected '%s', got '%s'\n", oauthStateString, state)
        http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
        return
    }

    code := r.FormValue("code")
    token, err := oauthConfig.Exchange(context.Background(), code)
    if err != nil {
        fmt.Printf("oauthConf.Exchange() failed with '%s'\n", err)
        http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
        return
    }

    oauthClient := oauthConfig.Client(context.Background(), token)
    userResponse, err := oauthClient.Get("https://api.github.com/user")
    if err != nil {
        fmt.Printf("Get user info failed with '%s'\n", err)
        http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
        return
    }
    defer userResponse.Body.Close()

    // Decode the GitHub user profile
    var githubUser struct {
        ID    string `json:"id"`
        Login string `json:"login"`
    }
    if err := json.NewDecoder(userResponse.Body).Decode(&githubUser); err != nil {
        log.Printf("Error decoding GitHub response: %v", err)
        http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
        return
    }

    fmt.Println("Setting user session")
    session, _ := store.Get(r, "session-name")
    session.Values["authenticated"] = true
    err = session.Save(r, w) // Fixed here
    if err != nil {
        fmt.Println("Error saving session:", err)
    }

    // Redirect to frontend application
    http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
}

func setupRoutes(router *mux.Router) {
	router.HandleFunc("/", homeHandler)
	router.HandleFunc("/auth/github", githubLogin)
	router.HandleFunc("/auth/github/callback", githubCallback)
	router.HandleFunc("/api/userdata", userDataHandler) // Add the userdata route
	// Define other routes
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	connectDB()
	setupOAuth()

	router := mux.NewRouter()
	setupRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" // Default port if not specified
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // or "*" for allowing any origin
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"},
	})

	handler := c.Handler(router)

	fmt.Printf("Server is running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), handler))
}

func userExists(userID string) (bool, error) {
	collection := client.Database("yourDatabase").Collection("users")
	filter := bson.M{"userid": userID}
	var result bson.M
	err := collection.FindOne(context.TODO(), filter).Decode(&result)

	return result != nil, err
}
