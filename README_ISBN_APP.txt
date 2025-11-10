ISBN to CSV Converter
=====================

This application fetches book details from Google Books API using ISBN and saves them to a CSV file.

Features:
- Web interface to enter ISBN and fetch book details
- REST API endpoints for programmatic access
- CSV export functionality
- Batch processing capability

Files included:
- isbn_to_csv.py: Main Flask application
- templates/index.html: Web interface
- batch_isbn_processor.py: Example script for batch processing
- requirements.txt: Python dependencies
- run_isbn_app.bat: Windows batch file to run the application

How to run:
1. Install Python (if not already installed)
2. Install required packages:
   pip install -r requirements.txt
3. Run the application:
   python isbn_to_csv.py
   OR double-click run_isbn_app.bat
4. Open your browser and go to http://localhost:81

API Endpoints:
- GET /api/book/<isbn> - Fetch book details by ISBN
- POST /api/books - Add multiple books (JSON payload: {"isbns": ["isbn1", "isbn2"]})

The application will create a books.csv file in the same directory with the following columns:
ISBN, Title, Author, Category

Example CSV output:
ISBN,Title,Author,Category
978-0-123456-78-9,Introduction to Computer Science,John Smith,Technology