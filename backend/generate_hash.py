from passlib.context import CryptContext
import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_hash():
    print("--- Password Hash Generator ---")
    password = getpass.getpass("Enter the password to hash: ")
    if not password:
        print("Error: Password cannot be empty.")
        return

    hashed_password = pwd_context.hash(password)
    print(f"\nYour hashed password is:\n{hashed_password}\n")
    print("Copy the line above and paste it into your .env file as ADMIN_PASSWORD=")

if __name__ == "__main__":
    generate_hash()
