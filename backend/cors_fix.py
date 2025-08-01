import re

with open('main.py', 'r') as f:
    content = f.read()

# 既存のCORS設定を削除
content = re.sub(r'# CORS設定.*?\)', '', content, flags=re.DOTALL)
content = re.sub(r'app\.add_middleware\(\s*CORSMiddleware[\s\S]*?\)', '', content)

# 新しいCORS設定を追加（FastAPI定義の直後）
fastapi_pattern = r'(app = FastAPI\([^)]*\))'
replacement = r'''\1

# 完全CORS無効化設定
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)'''

content = re.sub(fastapi_pattern, replacement, content)

with open('main.py', 'w') as f:
    f.write(content)

print("✅ CORS完全無効化設定完了")
