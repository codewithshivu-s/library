import csv
import random

# Sample book data
books = [
    {"ISBN": "978-0-123456-78-9", "Title": "Introduction to Computer Science", "Author": "John Smith", "Category": "Technology"},
    {"ISBN": "978-0-987654-32-1", "Title": "Advanced Mathematics", "Author": "Jane Doe", "Category": "Mathematics"},
    {"ISBN": "978-0-555555-55-5", "Title": "World History", "Author": "Robert Johnson", "Category": "History"},
    {"ISBN": "978-0-111111-11-1", "Title": "Modern Physics", "Author": "Emily Chen", "Category": "Science"},
    {"ISBN": "978-0-222222-22-2", "Title": "Literature Classics", "Author": "Michael Brown", "Category": "Literature"},
    {"ISBN": "978-0-333333-33-3", "Title": "Artificial Intelligence Basics", "Author": "Sarah Wilson", "Category": "Technology"},
    {"ISBN": "978-0-444444-44-4", "Title": "Economics Principles", "Author": "David Miller", "Category": "Economics"},
    {"ISBN": "978-0-555666-77-7", "Title": "Biology Fundamentals", "Author": "Lisa Davis", "Category": "Science"}
]

# Write to CSV file
with open('sample_books.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['ISBN', 'Title', 'Author', 'Category']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    
    writer.writeheader()
    for book in books:
        writer.writerow(book)

print("Sample CSV file 'sample_books.csv' has been created with {} books.".format(len(books)))