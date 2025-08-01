import re
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()
cors_pattern = r'app\.add_middleware\(\s*CORSMiddleware[\s\S]*?\)'
new_cors = '''app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://glasses-color-app.vercel.app",
        "https://glasses-color-6qaeah2zx-wataru-1010s-projects.vercel.app",
        "https://glasses-color-app-git-main-wataru-1010s-projects.vercel.app",
        "https://*.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)'''
content = re.sub(cors_pattern, new_cors, content)
with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ CORS設定をRender用に修正しました")
