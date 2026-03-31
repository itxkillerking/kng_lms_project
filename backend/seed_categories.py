import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kng_lms.settings')
django.setup()

from courses.models import Category

def seed_categories():
    categories = [
        {'name': 'AI Tool Usage', 'icon': 'Bot'},
        {'name': 'LLM Development', 'icon': 'Cpu'},
        {'name': 'RAG Development', 'icon': 'Database'},
        {'name': 'Web Development', 'icon': 'Globe'},
        {'name': 'Mobile Development', 'icon': 'Smartphone'},
        {'name': 'Data Science', 'icon': 'BarChart'},
        {'name': 'Cyber Security', 'icon': 'Shield'},
        {'name': 'Blockchain & Web3', 'icon': 'Link'},
        {'name': 'Artificial Intelligence', 'icon': 'Zap'},
        {'name': 'Machine Learning', 'icon': 'Binary'},
    ]

    for cat_data in categories:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={'icon_name': cat_data['icon']}
        )
        if created:
            print(f"Created category: {cat_data['name']}")
        else:
            print(f"Category already exists: {cat_data['name']}")

if __name__ == "__main__":
    seed_categories()
