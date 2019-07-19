from flask import Blueprint, jsonify

recommend_controller = Blueprint('recommend_controller', __name__)

@recommend_controller.route('/<string:file_path>')
def show(file_path):
    return jsonify({
        'msg': 'you are in recommend path. To be done...'
    })
