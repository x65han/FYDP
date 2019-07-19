from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from werkzeug import secure_filename
import os

application = app = Flask(__name__)


@app.route('/upload/list', methods=['GET'])
def get():
    return jsonify({'msg': 'Hello World'})


@app.route('/upload', methods=['POST'])
def upload_file():
    f = request.files['file']
    file_save_path = os.path.join('uploads', secure_filename(f.filename))
    f.save(file_save_path)
    return 'file uploaded successfully'

@app.route('/uploads/<path:path>')
def send_uploaded_files(path):
    return send_from_directory('uploads', path)


@app.route('/')
def home():
    return render_template('home.html')


# Run Server
if __name__ == '__main__':
    app.run(debug=True)
