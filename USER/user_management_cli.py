import csv
import os

def add_user():
    users = []
    
    print("User Management System - Add Students & Teachers")
    print("=" * 50)
    
    while True:
        print("\n1. Add Student")
        print("2. Add Teacher")
        print("3. Export to CSV")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            print("\n--- Add Student ---")
            name = input("Full Name: ").strip()
            username = input("Username: ").strip()
            password = input("Password: ")
            student_class = input("Class: ").strip()
            
            if not name or not username or not password:
                print("Error: Please fill in all required fields (Name, Username, Password)")
                continue
            
            # Generate admin number
            count = len([u for u in users if u["Role"] == "student"]) + 1
            admin_number = f"STU{count:04d}"
            
            user = {
                "FullName": name,
                "Username": username,
                "Password": password,
                "Role": "student",
                "AdminNumber": admin_number,
                "Class": student_class
            }
            
            users.append(user)
            print(f"Student added successfully! Admin Number: {admin_number}")
            
        elif choice == "2":
            print("\n--- Add Teacher ---")
            admin_name = input("Admin Name: ").strip()
            name = input("Full Name: ").strip()
            username = input("Username: ").strip()
            password = input("Password: ")
            
            if not admin_name or not name or not username or not password:
                print("Error: Please fill in all required fields (Admin Name, Name, Username, Password)")
                continue
            
            # Generate admin number
            count = len([u for u in users if u["Role"] == "teacher"]) + 1
            admin_number = f"TCH{count:04d}"
            
            user = {
                "FullName": name,
                "Username": username,
                "Password": password,
                "Role": "teacher",
                "AdminNumber": admin_number,
                "AdminName": admin_name
            }
            
            users.append(user)
            print(f"Teacher added successfully! Admin Number: {admin_number}")
            
        elif choice == "3":
            if not users:
                print("No users to export")
                continue
            
            filename = input("Enter CSV filename (without extension): ").strip()
            if not filename:
                filename = "users"
            
            filename = f"{filename}.csv"
            
            try:
                with open(filename, mode='w', newline='', encoding='utf-8') as file:
                    writer = csv.writer(file)
                    
                    # Write header
                    writer.writerow(["FullName", "Username", "Password", "Role", "AdminNumber", "Class"])
                    
                    # Write user data
                    for user in users:
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
                
                print(f"Users exported successfully to: {filename}")
            except Exception as e:
                print(f"Failed to export CSV: {str(e)}")
                
        elif choice == "4":
            print("Goodbye!")
            break
            
        else:
            print("Invalid choice. Please enter 1, 2, 3, or 4.")

if __name__ == "__main__":
    add_user()