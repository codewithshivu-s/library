from flask import Flask, render_template, request, jsonify
import csv
import os
import urllib.request
import json

app = Flask(__name__)

def get_book_details(isbn):
    """Fetch book details from Google Books API"""
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print("Error fetching data:", e)
        return None

    if "items" not in data:
        return None

    book_info = data["items"][0]["volumeInfo"]
    title = book_info.get("title", "N/A")
    authors = ", ".join(book_info.get("authors", ["Unknown"]))
    categories = ", ".join(book_info.get("categories", ["Not specified"]))

    return {"ISBN": isbn, "Title": title, "Author": authors, "Category": categories}

def save_to_csv(book_data, filename="books.csv"):
    """Save book details to CSV"""
    file_exists = os.path.isfile(filename)
    with open(filename, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["ISBN", "Title", "Author", "Category"])
        if not file_exists:
            writer.writeheader()
        writer.writerow(book_data)

@app.route("/", methods=["GET", "POST"])
def index():
    book_data = None
    if request.method == "POST":
        isbn = request.form.get("isbn")
        if isbn:
            book_data = get_book_details(isbn)
            if book_data:
                save_to_csv(book_data)
    return render_template("index.html", book=book_data)

# API endpoint to fetch book details by ISBN
@app.route("/api/book/<isbn>")
def get_book_by_isbn(isbn):
    book_data = get_book_details(isbn)
    if book_data:
        return jsonify(book_data)
    else:
        return jsonify({"error": "Book not found"}), 404

# API endpoint to add multiple books by ISBNs
@app.route("/api/books", methods=["POST"])
def add_books():
    data = request.get_json()
    isbns = data.get("isbns", [])
    books = []
    
    for isbn in isbns:
        book_data = get_book_details(isbn)
        if book_data:
            save_to_csv(book_data)
            books.append(book_data)
    
    return jsonify({"message": f"Added {len(books)} books to CSV", "books": books})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=81, debug=True)