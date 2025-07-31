from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return '''
    <h1>🎉 メガネレンズカラー試着アプリ</h1>
    <p>Hello World! Google Cloud Runで動作中！</p>
    <p>開発開始準備完了！</p>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
