from flask import Blueprint, jsonify, request, send_file, render_template
import imageio
# imageio.plugins.ffmpeg.download()
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
    res_paths = []
    for t in times:
        if t > duration: break
        imgpath = '{}-{}.png'.format(movie_path[0:-4], t)
        res_paths.append(imgpath)
        clip.save_frame(imgpath, t)

    return res_paths

@recommend_controller.route('/<string:file_path>')
def recommend_given_file(file_path):
    full_path = os.path.join('uploads', file_path)
    file_exists = validate_media_path(full_path)
    print('[Recommend][file_path][exists]', file_path, file_exists)

    if file_exists is False:
        return jsonify({
            'message': "Invalid Media Path",
            'exists': file_exists,
            'path': file_path
        }), 400

    # isVideo -> boolean
    isVideo = file_path[-4:] in {'.mov'}
    extracted_frames_path = [full_path]

    # Extract Frames from Video
    if isVideo:
        duration = get_video_duration(full_path)

        times = []
        time = 0
        while time <= duration:
            times.append(time)
            time += 0.5

        extracted_frames_path = extract_frames(full_path, times, duration)

    # Image2Text
    print('Started [model].[inference]', full_path)
    image2text = model.inference(cv2.imread(full_path), plot=False)
    # image2text = 'tbd'
    print('Done [model].[inference]', image2text)

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

@recommend_controller.route('/show/<string:file_path>')
def recommend_show(file_path):
    full_path = os.path.join('uploads', file_path)
    file_exists = validate_media_path(full_path)
    print('[Recommend][file_path][exists]', file_path, file_exists)

    if file_exists is False:
        return jsonify({
            'message': "Invalid Media Path",
            'exists': file_exists,
            'path': file_path
        }), 400

    if file_path[-4:] in {'.png', '.jpg'}:
        return send_file(full_path, mimetype='image/png')
    else:
        file_name = file_path[:-4]
        
        time = 0
        img_to_display = []
        while True:
            check_path = 'uploads/' + file_name + '-' + str(time) + '.png'
            if os.path.exists(check_path):
                img_to_display.append(check_path)
            else:
                break

            time += 0.5

        img_to_display = ['/' + path for path in img_to_display]
        return render_template(
            'show.html', 
            img_to_display=img_to_display, 
        )
