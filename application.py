from flask import Flask, render_template, send_from_directory, Blueprint
from controllers.recommend_controller import recommend_controller
from controllers.upload_controller import upload_controller
import os

application = app = Flask(__name__)

# Static Asset on Upload/ folder
@app.route('/uploads/<path:path>')
def send_uploaded_files(path):
    return send_from_directory('uploads', path)

@app.route('/uploads/rm/<path:path>')
def remove_uploaded_files(path):
    os.remove(os.path.join('uploads', path))
    return ('', 200)

# BluePrint Routes
app.register_blueprint(recommend_controller, url_prefix='/recommend')
app.register_blueprint(upload_controller, url_prefix='/upload')

# Home Route
@app.route('/')
def home():
    return render_template('home.html')


# Run Server
if __name__ == '__main__':
    app.run(debug=True)
