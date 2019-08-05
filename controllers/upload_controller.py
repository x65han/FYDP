from werkzeug import secure_filename
from flask import Blueprint, jsonify, request
import os

upload_controller = Blueprint('upload_controller', __name__)

# List all Files
@upload_controller.route('/list', methods=['GET'])
def upload_list():
    res = os.listdir('./uploads')
    valid_ext = {'.jpg', '.png', '.mov'}
    res = [item for item in res if item[-4:] in valid_ext]
    return jsonify(res)

# Remove Uploaded File
@upload_controller.route('/rm/<path:path>', methods=['GET'])
def remove_file(path):
    status_code = 404
    full_path = os.path.join('uploads', path)
    if os.path.exists(full_path):
        os.remove(full_path)
        status_code = 200

    res = os.listdir('./uploads')
    valid_ext = {'.jpg', '.png', '.mov'}
    res = [item for item in res if item[-4:] in valid_ext]
    return jsonify(res), status_code

# File Uploader
@upload_controller.route('', methods=['POST'])
def upload_file():
    f = request.files['file']
    file_save_path = os.path.join('uploads', secure_filename(f.filename))
    f.save(file_save_path)
    return 'file uploaded successfully'
