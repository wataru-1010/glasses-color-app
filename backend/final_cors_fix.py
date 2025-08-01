import re
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'app\.add_middleware\(\s*CORSMiddleware[\s\S]*?\)', '', content)
app_pattern = r'(app = FastAPI\([^)]*\))'
cors_replacement = r'''\1
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://glasses-color-app.vercel.app",
        "https://glasses-color-6qaeah2zx-wataru-1010s-projects.vercel.app", 
        "https://glasses-color-app-git-main-wataru-1010s-projects.vercel.app",
        "https://*.vercel.app",
        "https://vercel.app",
        "*"
    ],
    allow_credentials=False,  # 変更: False
    allow_methods=["GET", "POST", "OPTIONS"],  # 明示的に指定
    allow_headers=[
        "accept",
        "accept-encoding", 
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
        "*"
    ],
    expose_headers=["*"],
    max_age=3600
)
@app.options("/detect-lens")
async def detect_lens_options():
    return {"status": "ok"}

@app.options("/apply-color") 
async def apply_color_options():
    return {"status": "ok"}'''

content = re.sub(app_pattern, cors_replacement, content)
with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 最終CORS設定を適用しました")
