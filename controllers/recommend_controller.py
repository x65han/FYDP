from flask import Blueprint, jsonify, request
import imageio
imageio.plugins.ffmpeg.download()
from moviepy.editor import VideoFileClip
import os, random, json, cv2
from ml_prod.image2text import model
recommend_controller = Blueprint('recommend_controller', __name__)

# load songs.json
with open('./songs/songs.json', 'r') as f:
    Catalog = json.load(f)


def validate_media_path(path):
    return os.path.isfile(path)


def get_video_duration(path):
    duration = VideoFileClip(path).duration
    return duration


def extract_frames(movie_path, times, duration=0):
    clip = VideoFileClip(movie_path)
    for t in times:
        if t > duration: break
        imgpath = '{}-{}.png'.format(movie_path[0:-4], t)
        clip.save_frame(imgpath, t)


@recommend_controller.route('/<string:file_path>')
def show(file_path):
    full_path = os.path.join('uploads', file_path)
    file_exists = validate_media_path(full_path)
    print('[Recommend][file_path][exists]', file_path, file_exists)

    if file_exists is False:
        return jsonify({
            'message': "Invalid Media Path",
            'exists': file_exists,
            'path': file_path
        }), 400

    # Extract Frames from Video
    if file_path[-4:] in {'.mov'}:
        duration = get_video_duration(full_path)

        times = []
        time = 0
        while time <= duration:
            times.append(time)
            time += 0.5

        extract_frames(full_path, times, duration)

    # Image2Text
    image2text = model.inference(cv2.imread(full_path), plot=False)

    # Generate Random Recommendation
    playlist = []
    tabu = set()
    i = 0
    while len(tabu) < 3:
        if random.uniform(0, 1) > 0.5 and i not in tabu:
            playlist.append(Catalog['songs'][i])
            tabu.add(i)
        i = (i + 1) % len(Catalog['songs'])

    print(request.base_url)
    return jsonify({
        'playlist': playlist,
        'image2text': image2text,
        'img_url': request.base_url.replace('/recommend/', '/uploads/')
    })
