import csv
import os
from tkinter import *
from tkinter import ttk, messagebox, filedialog

class UserManagementApp:
    def __init__(self, root):
        self.root = root
        self.root.title("User Management - Add Students & Teachers")
        self.root.geometry("600x500")
        
        # Initialize users list
        self.users = []
        
        # Main frame
        main_frame = Frame(root, padx=20, pady=20)
        main_frame.pack(fill=BOTH, expand=True)
        
        # Title
        title_label = Label(main_frame, text="Add Students & Teachers", font=("Arial", 16, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Notebook for tabs
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill=BOTH, expand=True)
        
        # Student tab
        self.student_frame = Frame(self.notebook)
        self.notebook.add(self.student_frame, text="Add Student")
        self.create_student_tab()
        
        # Teacher tab
        self.teacher_frame = Frame(self.notebook)
        self.notebook.add(self.teacher_frame, text="Add Teacher")
        self.create_teacher_tab()
        
        # List tab
        self.list_frame = Frame(self.notebook)
        self.notebook.add(self.list_frame, text="User List")
        self.create_list_tab()
        
        # Load existing users from CSV if it exists
        self.load_existing_users()
    
    def create_student_tab(self):
        # Student form
        form_frame = Frame(self.student_frame)
        form_frame.pack(fill=BOTH, expand=True, pady=10)
        
        # Full Name
        Label(form_frame, text="Full Name:").grid(row=0, column=0, sticky=W, pady=5)
        self.student_name = Entry(form_frame, width=30)
        self.student_name.grid(row=0, column=1, pady=5, padx=(10, 0))
        
        # Username
        Label(form_frame, text="Username:").grid(row=1, column=0, sticky=W, pady=5)
        self.student_username = Entry(form_frame, width=30)
        self.student_username.grid(row=1, column=1, pady=5, padx=(10, 0))
        
        # Password
        Label(form_frame, text="Password:").grid(row=2, column=0, sticky=W, pady=5)
        self.student_password = Entry(form_frame, width=30, show="*")
        self.student_password.grid(row=2, column=1, pady=5, padx=(10, 0))
        
        # Class
        Label(form_frame, text="Class:").grid(row=3, column=0, sticky=W, pady=5)
        self.student_class = Entry(form_frame, width=30)
        self.student_class.grid(row=3, column=1, pady=5, padx=(10, 0))
        
        # Admin Number (auto-generated)
        Label(form_frame, text="Admin Number:").grid(row=4, column=0, sticky=W, pady=5)
        self.student_admin = Entry(form_frame, width=30, state=DISABLED)
        self.student_admin.grid(row=4, column=1, pady=5, padx=(10, 0))
        
        # Buttons
        button_frame = Frame(form_frame)
        button_frame.grid(row=5, column=0, columnspan=2, pady=20)
        
        add_button = Button(button_frame, text="Add Student", command=self.add_student, bg="#4CAF50", fg="white")
        add_button.pack(side=LEFT, padx=(0, 10))
        
        clear_button = Button(button_frame, text="Clear", command=self.clear_student_form)
        clear_button.pack(side=LEFT)
    
    def create_teacher_tab(self):
        # Teacher form
        form_frame = Frame(self.teacher_frame)
        form_frame.pack(fill=BOTH, expand=True, pady=10)
        
        # Admin Name (for teachers)
        Label(form_frame, text="Admin Name:").grid(row=0, column=0, sticky=W, pady=5)
        self.teacher_admin_name = Entry(form_frame, width=30)
        self.teacher_admin_name.grid(row=0, column=1, pady=5, padx=(10, 0))
        
        # Full Name
        Label(form_frame, text="Full Name:").grid(row=1, column=0, sticky=W, pady=5)
        self.teacher_name = Entry(form_frame, width=30)
        self.teacher_name.grid(row=1, column=1, pady=5, padx=(10, 0))
        
        # Username
        Label(form_frame, text="Username:").grid(row=2, column=0, sticky=W, pady=5)
        self.teacher_username = Entry(form_frame, width=30)
        self.teacher_username.grid(row=2, column=1, pady=5, padx=(10, 0))
        
        # Password
        Label(form_frame, text="Password:").grid(row=3, column=0, sticky=W, pady=5)
        self.teacher_password = Entry(form_frame, width=30, show="*")
        self.teacher_password.grid(row=3, column=1, pady=5, padx=(10, 0))
        
        # Buttons
        button_frame = Frame(form_frame)
        button_frame.grid(row=4, column=0, columnspan=2, pady=20)
        
        add_button = Button(button_frame, text="Add Teacher", command=self.add_teacher, bg="#4CAF50", fg="white")
        add_button.pack(side=LEFT, padx=(0, 10))
        
        clear_button = Button(button_frame, text="Clear", command=self.clear_teacher_form)
        clear_button.pack(side=LEFT)
    
    def create_list_tab(self):
        # List controls
        controls_frame = Frame(self.list_frame)
        controls_frame.pack(fill=X, pady=(0, 10))
        
        export_button = Button(controls_frame, text="Export to CSV", command=self.export_to_csv, bg="#2196F3", fg="white")
        export_button.pack(side=LEFT, padx=(0, 10))
        
        clear_button = Button(controls_frame, text="Clear All", command=self.clear_all_users)
        clear_button.pack(side=LEFT)
        
        # Treeview for user list
        tree_frame = Frame(self.list_frame)
        tree_frame.pack(fill=BOTH, expand=True)
        
        # Scrollbars
        v_scrollbar = Scrollbar(tree_frame, orient=VERTICAL)
        v_scrollbar.pack(side=RIGHT, fill=Y)
        
        h_scrollbar = Scrollbar(tree_frame, orient=HORIZONTAL)
        h_scrollbar.pack(side=BOTTOM, fill=X)
        
        # Treeview
        self.user_tree = ttk.Treeview(tree_frame, columns=("Name", "Username", "Role", "Class/Subject", "Admin Number"), 
                                      show="headings", yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Configure scrollbars
        v_scrollbar.config(command=self.user_tree.yview)
        h_scrollbar.config(command=self.user_tree.xview)
        
        # Define headings
        self.user_tree.heading("Name", text="Full Name")
        self.user_tree.heading("Username", text="Username")
        self.user_tree.heading("Role", text="Role")
        self.user_tree.heading("Class/Subject", text="Class/Admin Name")
        self.user_tree.heading("Admin Number", text="Admin Number")
        
        # Define column widths
        self.user_tree.column("Name", width=120)
        self.user_tree.column("Username", width=100)
        self.user_tree.column("Role", width=80)
        self.user_tree.column("Class/Subject", width=100)
        self.user_tree.column("Admin Number", width=100)
        
        self.user_tree.pack(fill=BOTH, expand=True)
        
        # Don't call refresh_user_list here to avoid initialization issues
    
    def add_student(self):
        name = self.student_name.get().strip()
        username = self.student_username.get().strip()
        password = self.student_password.get()
        student_class = self.student_class.get().strip()
        
        if not name or not username or not password:
            messagebox.showerror("Error", "Please fill in all required fields (Name, Username, Password)")
            return
        
        # Generate admin number
        admin_number = self.generate_admin_number("STU")
        
        # Add to users list
        user = {
            "FullName": name,
            "Username": username,
            "Password": password,
            "Role": "student",
            "AdminNumber": admin_number,
            "Class": student_class
        }
        
        self.users.append(user)
        self.refresh_user_list()
        self.clear_student_form()
        
        messagebox.showinfo("Success", f"Student added successfully!\nAdmin Number: {admin_number}")
    
    def add_teacher(self):
        admin_name = self.teacher_admin_name.get().strip()
        name = self.teacher_name.get().strip()
        username = self.teacher_username.get().strip()
        password = self.teacher_password.get()
        
        if not admin_name or not name or not username or not password:
            messagebox.showerror("Error", "Please fill in all required fields (Admin Name, Name, Username, Password)")
            return
        
        # Generate admin number
        admin_number = self.generate_admin_number("TCH")
        
        # Add to users list (without subject)
        user = {
            "FullName": name,
            "Username": username,
            "Password": password,
            "Role": "teacher",
            "AdminNumber": admin_number,
            "AdminName": admin_name
        }
        
        self.users.append(user)
        self.refresh_user_list()
        self.clear_teacher_form()
        
        messagebox.showinfo("Success", f"Teacher added successfully!\nAdmin Number: {admin_number}")
    
    def generate_admin_number(self, prefix):
        # Generate a simple admin number based on the prefix and current count
        count = len([u for u in self.users if u["Role"] == ("student" if prefix == "STU" else "teacher")]) + 1
        return f"{prefix}{count:04d}"
    
    def clear_student_form(self):
        self.student_name.delete(0, END)
        self.student_username.delete(0, END)
        self.student_password.delete(0, END)
        self.student_class.delete(0, END)
    
    def clear_teacher_form(self):
        self.teacher_admin_name.delete(0, END)
        self.teacher_name.delete(0, END)
        self.teacher_username.delete(0, END)
        self.teacher_password.delete(0, END)
    
    def clear_all_users(self):
        if messagebox.askyesno("Confirm", "Are you sure you want to clear all users?"):
            self.users = []
            self.refresh_user_list()
            messagebox.showinfo("Success", "All users cleared")
    
    def refresh_user_list(self):
        # Clear existing items
        for item in self.user_tree.get_children():
            self.user_tree.delete(item)
        
        # Add users to treeview
        for user in self.users:
            if user["Role"] == "student":
                class_subject = user.get("Class", "")
            else:  # teacher
                class_subject = user.get("AdminName", "")
            
            self.user_tree.insert("", END, values=(
                user["FullName"],
                user["Username"],
                user["Role"],
                class_subject,
                user["AdminNumber"]
            ))
    
    def load_existing_users(self):
        # In a real application, you might load from a file or database
        # For now, we'll start with an empty list
        pass
    
    def export_to_csv(self):
        if not self.users:
            messagebox.showwarning("Warning", "No users to export")
            return
        
        # Ask user for file location
        file_path = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
            title="Save CSV file"
        )
        
        if not file_path:
            return
        
        try:
            with open(file_path, mode='w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                
                # Write header
                writer.writerow(["FullName", "Username", "Password", "Role", "AdminNumber", "Class"])
                
                # Write user data
                for user in self.users:
                    # For CSV import, we need to map teacher admin name to Class column
                    class_value = user.get("Class", "") if user["Role"] == "student" else user.get("AdminName", "")
                    writer.writerow([
                        user["FullName"],
                        user["Username"],
                        user["Password"],
                        user["Role"],
                        user["AdminNumber"],
                        class_value
                    ])
            
            messagebox.showinfo("Success", f"Users exported successfully to:\n{file_path}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export CSV:\n{str(e)}")

def main():
    root = Tk()
    app = UserManagementApp(root)
    # Refresh the user list after initialization
    app.refresh_user_list()
    root.mainloop()

if __name__ == "__main__":
    main()