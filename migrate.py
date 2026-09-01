import re

def migrate_schema():
    with open('prisma/schema.prisma', 'r') as f:
        content = f.read()

    # Change provider
    content = content.replace('provider = "mongodb"', 'provider = "postgresql"')

    # Remove @map("_id")
    content = content.replace(' @map("_id")', '')
    
    # Save the updated schema
    with open('prisma/schema.prisma', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    migrate_schema()
