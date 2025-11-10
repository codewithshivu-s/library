import csv
import json
import urllib.request
import os
from tkinter import *
from tkinter import ttk, messagebox, filedialog

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
    return filename

class ISBNLookupApp:
    def __init__(self, root):
        self.root = root
        self.root.title("ISBN to CSV Converter")
        self.root.geometry("600x500")
        
        # Book data list
        self.book_data_list = []
        
        # Create GUI elements
        self.create_widgets()
        
    def create_widgets(self):
        # Title
        title_label = Label(self.root, text="ISBN to CSV Converter", font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        # Description
        desc_label = Label(self.root, text="Enter ISBN to fetch book details from Google Books API", font=("Arial", 10))
        desc_label.pack(pady=5)
        
        # ISBN Entry
        isbn_frame = Frame(self.root)
        isbn_frame.pack(pady=10)
        
        Label(isbn_frame, text="ISBN:", font=("Arial", 12)).pack(side=LEFT, padx=5)
        self.isbn_entry = Entry(isbn_frame, width=30, font=("Arial", 12))
        self.isbn_entry.pack(side=LEFT, padx=5)
        self.isbn_entry.bind("<Return>", self.fetch_book)
        
        # Fetch Button
        fetch_btn = Button(isbn_frame, text="Fetch Book", command=self.fetch_book, 
                          bg="#4CAF50", fg="white", font=("Arial", 10, "bold"))
        fetch_btn.pack(side=LEFT, padx=5)
        
        # Results Frame
        results_frame = LabelFrame(self.root, text="Book Details", font=("Arial", 12, "bold"))
        results_frame.pack(pady=10, padx=20, fill=BOTH, expand=True)
        
        # Results Text
        self.results_text = Text(results_frame, height=10, font=("Arial", 10))
        self.results_text.pack(pady=10, padx=10, fill=BOTH, expand=True)
        
        # Save Button
        save_btn = Button(self.root, text="Add to List", command=self.add_to_list, 
                         bg="#2196F3", fg="white", font=("Arial", 10, "bold"))
        save_btn.pack(pady=10)
        
        # Book List Frame
        list_frame = LabelFrame(self.root, text="Book List", font=("Arial", 12, "bold"))
        list_frame.pack(pady=10, padx=20, fill=BOTH, expand=True)
        
        # Book List Text
        self.list_text = Text(list_frame, height=8, font=("Arial", 9))
        self.list_text.pack(pady=10, padx=10, fill=BOTH, expand=True)
        
        # Download CSV Button
        download_btn = Button(self.root, text="Download CSV", command=self.download_csv, 
                             bg="#FF9800", fg="white", font=("Arial", 10, "bold"))
        download_btn.pack(pady=10)
        
        # Status Bar
        self.status_var = StringVar()
        self.status_var.set("Ready")
        status_bar = Label(self.root, textvariable=self.status_var, bd=1, relief=SUNKEN, anchor=W)
        status_bar.pack(side=BOTTOM, fill=X)
        
    def fetch_book(self, event=None):
        isbn = self.isbn_entry.get().strip()
        if not isbn:
            messagebox.showwarning("Input Error", "Please enter an ISBN")
            return
            
        self.status_var.set("Fetching book details...")
        self.root.update()
        
        book_data = get_book_details(isbn)
        if book_data:
            self.current_book_data = book_data
            result_text = f"ISBN: {book_data['ISBN']}\n"
            result_text += f"Title: {book_data['Title']}\n"
            result_text += f"Author: {book_data['Author']}\n"
            result_text += f"Category: {book_data['Category']}\n"
            self.results_text.delete(1.0, END)
            self.results_text.insert(1.0, result_text)
            self.status_var.set("Book details fetched successfully")
        else:
            self.results_text.delete(1.0, END)
            self.results_text.insert(1.0, "Book not found for the given ISBN")
            self.status_var.set("Book not found")
            
    def add_to_list(self):
        if not hasattr(self, 'current_book_data'):
            messagebox.showwarning("No Data", "Please fetch a book first")
            return
            
        # Add to book list
        self.book_data_list.append(self.current_book_data)
        
        # Update list display
        self.update_list_display()
        
        # Clear current book data
        delattr(self, 'current_book_data')
        self.results_text.delete(1.0, END)
        self.isbn_entry.delete(0, END)
        
        messagebox.showinfo("Success", "Book added to list")
        self.status_var.set(f"Added to list. Total books: {len(self.book_data_list)}")
        
    def update_list_display(self):
        self.list_text.delete(1.0, END)
        if not self.book_data_list:
            self.list_text.insert(1.0, "No books in list")
            return
            
        for i, book in enumerate(self.book_data_list, 1):
            self.list_text.insert(END, f"{i}. {book['Title']} - {book['Author']}\n")
        
    def download_csv(self):
        if not self.book_data_list:
            messagebox.showwarning("No Data", "No books in list to export")
            return
            
        # Ask for filename
        filename = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
        )
        
        if not filename:
            return
            
        try:
            # Save to CSV
            with open(filename, mode="w", newline="", encoding="utf-8") as file:
                writer = csv.DictWriter(file, fieldnames=["ISBN", "Title", "Author", "Category"])
                writer.writeheader()
                for book in self.book_data_list:
                    writer.writerow(book)
                    
            messagebox.showinfo("Success", f"CSV file saved successfully!\nBooks exported: {len(self.book_data_list)}")
            self.status_var.set(f"CSV file saved: {filename}")
        except Exception as e:
            messagebox.showerror("Error", f"Error saving CSV file: {str(e)}")
            self.status_var.set("Error saving CSV file")

def main():
    root = Tk()
    app = ISBNLookupApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()