import requests
import json

# List of ISBNs to process
isbns = [
    "978-0-123456-78-9",
    "978-0-987654-32-1",
    "978-0-555555-55-5",
    "978-0-111111-11-1"
]

# URL of the Flask application
base_url = "http://localhost:81"

def fetch_book_by_isbn(isbn):
    """Fetch a single book by ISBN"""
    try:
        response = requests.get(f"{base_url}/api/book/{isbn}")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching book with ISBN {isbn}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception occurred while fetching book with ISBN {isbn}: {e}")
        return None

def fetch_multiple_books(isbn_list):
    """Fetch multiple books by ISBNs"""
    try:
        response = requests.post(
            f"{base_url}/api/books",
            json={"isbns": isbn_list},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching books: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception occurred while fetching books: {e}")
        return None

if __name__ == "__main__":
    print("ISBN to CSV Batch Processor")
    print("=" * 30)
    
    # Method 1: Fetch books one by one
    print("\nMethod 1: Fetching books individually")
    for isbn in isbns:
        print(f"Fetching book with ISBN: {isbn}")
        book = fetch_book_by_isbn(isbn)
        if book:
            print(f"  Title: {book['Title']}")
            print(f"  Author: {book['Author']}")
            print(f"  Category: {book['Category']}")
        print()
    
    # Method 2: Fetch all books at once
    print("\nMethod 2: Fetching all books at once")
    result = fetch_multiple_books(isbns)
    if result:
        print(f"Success: {result['message']}")
        for book in result['books']:
            print(f"  ISBN: {book['ISBN']}")
            print(f"  Title: {book['Title']}")
            print(f"  Author: {book['Author']}")
            print(f"  Category: {book['Category']}")
            print()