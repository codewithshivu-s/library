import csv
import json
import urllib.request
import sys
import os

def get_book_details(isbn):
    """Fetch book details from Google Books API"""
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

    if "items" not in data:
        return None

    book_info = data["items"][0]["volumeInfo"]
    title = book_info.get("title", "N/A")
    authors = ", ".join(book_info.get("authors", ["Unknown"]))
    categories = ", ".join(book_info.get("categories", ["Not specified"]))

    return {"ISBN": isbn, "Title": title, "Author": authors, "Category": categories}

def save_to_csv(book_data_list, filename="books.csv"):
    """Save book details to CSV"""
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["ISBN", "Title", "Author", "Category"])
        writer.writeheader()
        for book in book_data_list:
            writer.writerow(book)
    return filename

def main():
    print("ISBN to CSV Converter (CLI)")
    print("=" * 30)
    
    book_data_list = []
    
    while True:
        isbn = input("\nEnter ISBN (or 'done' to finish): ").strip()
        if isbn.lower() == 'done':
            break
            
        if not isbn:
            continue
            
        print(f"Fetching book details for ISBN: {isbn}")
        book_data = get_book_details(isbn)
        if book_data:
            book_data_list.append(book_data)
            print(f"  Title: {book_data['Title']}")
            print(f"  Author: {book_data['Author']}")
            print(f"  Category: {book_data['Category']}")
        else:
            print(f"  Book not found for ISBN: {isbn}")
    
    if not book_data_list:
        print("No books to export.")
        return
    
    print(f"\nTotal books fetched: {len(book_data_list)}")
    
    # Ask for filename
    filename = input("Enter filename for CSV (default: books.csv): ").strip()
    if not filename:
        filename = "books.csv"
    elif not filename.endswith('.csv'):
        filename += '.csv'
    
    try:
        save_to_csv(book_data_list, filename)
        print(f"CSV file '{filename}' saved successfully with {len(book_data_list)} books!")
    except Exception as e:
        print(f"Error saving CSV file: {e}")

if __name__ == "__main__":
    main()