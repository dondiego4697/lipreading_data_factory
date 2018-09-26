# -*- coding: utf-8 -*-
import os
import glob
import re
import time
import shutil
import dlib
import cv2
import csv
import math
import numpy as np
import imutils
from skimage import io
from os import listdir
from PIL import Image
import PIL
import signal
import sys
from resizeimage import resizeimage


detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(os.path.join(os.getcwd(), 'res', 'shape_predictor_68_face_landmarks.dat'))
OKBLUE = '\033[94m'
OKGREEN = '\033[92m'
ENDC = '\033[0m'
N_SIZE = 120


def resize_img_by_height(path, mouth_nose_distance):
    img = Image.open(path)
    w, h = img.size
    new_h = h * (N_SIZE / 2) / mouth_nose_distance
    ratio = (new_h / float(h))
    width = int((float(w) * float(ratio)))
    img = img.resize((width, int(new_h)), PIL.Image.ANTIALIAS)

    img.save(path)

# по определенным cv bound губ, создаем изображение 120*120
def get_normalize_mouth_bound(bound):
    mouth_center = [bound[0] + bound[2] / 2, bound[1] + bound[3] / 2]
    return (mouth_center[0] - N_SIZE / 2, mouth_center[1] - N_SIZE / 2, N_SIZE, N_SIZE, mouth_center)

def get_face_dots(path):
    try:
        dots = []
        img = io.imread(path)
        faces = detector(img, 1)
        if len(faces) != 1:
            raise Exception()

        # контрольные точки лица
        shape = predictor(img, faces[0])

        for i in range(shape.num_parts):
            dot = shape.parts().pop(i)
            dots.append([int(dot.x), int(dot.y)])

        if len(dots) != 68:
            raise Exception()

        return dots
    except Exception:
        return []

def prepare_img(path):
    MOUTH_NOSE_DIST_MAX = N_SIZE / 2 + 3
    MOUTH_NOSE_DIST_MIN = N_SIZE / 2

    dots = get_face_dots(path)
    if len(dots) == 0:
        return None

    nose_p = dots[30]
    mouth_p = dots[62]
    mouth_nose_distance = math.sqrt(math.pow(nose_p[0] - mouth_p[0], 2) + math.pow(nose_p[1] - mouth_p[1], 2))

    if not (MOUTH_NOSE_DIST_MIN <= mouth_nose_distance <= MOUTH_NOSE_DIST_MAX):
        resize_img_by_height(path, mouth_nose_distance)

def draw_rect_on_canvas(img, face_bound, dots):
    window_name = 'result'

    if face_bound:
        cv2.rectangle(img, (
                int(face_bound[0]),
                int(face_bound[1])
            ),(
                int(face_bound[0] + face_bound[2]),
                int(face_bound[1] + face_bound[3])
            ), (255, 255, 255), 2)

    for dot in dots:
        cv2.circle(img, (dot[0], dot[1]), 2, (0, 255, 255), -1)

    cv2.imshow(window_name, img)
    cv2.moveWindow(window_name, 0, 0)

    if not face_bound:
        cv2.waitKey(1)
    else:
        cv2.waitKey(100)

def create_file(path):
    open(path, 'a').close()

def remove_file(path):
    os.remove(path)

mouth_frames_data_busy_file = ''
def signal_handler(signal, frame):
    remove_file(mouth_frames_data_busy_file)
    sys.exit(0)

#---------------- start ----------------#

videos_names = listdir(os.path.join(os.getcwd(), 'videos'))
for num, video_name in enumerate(videos_names):
    print((OKGREEN + 'Start {}' + ENDC).format(video_name))
    if (video_name == '.DS_Store' or video_name == '._.DS_Store'):
        continue

    frames_folder = os.path.join(os.getcwd(), 'videos', video_name, 'frames')
    mouth_frames_folder = os.path.join(os.getcwd(), 'videos', video_name, 'mouth_frames')
    mouth_frames_data_ok_file = os.path.join(os.getcwd(), 'videos', video_name, 'mouth_frames', '@complete')
    mouth_frames_data_busy_file = os.path.join(os.getcwd(), 'videos', video_name, 'mouth_frames', '@busy')

    if not os.path.exists(mouth_frames_folder):
        os.makedirs(mouth_frames_folder)
    else:
        if os.path.exists(mouth_frames_data_ok_file):
            print((OKGREEN + 'Video already cooked' + ENDC))
            continue
        if os.path.exists(mouth_frames_data_busy_file):
            print((OKGREEN + 'Video already cooking' + ENDC))
            continue

    create_file(mouth_frames_data_busy_file)
    signal.signal(signal.SIGINT, signal_handler)

    # список всех кадров
    glob_frames = glob.glob(os.path.join(frames_folder, "*.jpg"))
    glob_mouth_frames = glob.glob(os.path.join(mouth_frames_folder, "*.jpg"))
    glob_frames_sorted = sorted(glob_frames, key=lambda name: int(re.search('\/thumb(\d+)\.\w+$', name).group(1)))
    glob_mouth_frames_sorted = sorted(glob_mouth_frames, key=lambda name: int(re.search('\/(\d+)\.\w+$', name).group(1)))

    last_mouth_frame_path = ''
    if len(glob_mouth_frames_sorted) > 0:
        last_mouth_frame_path = glob_mouth_frames_sorted[len(glob_mouth_frames_sorted) - 1]

    last_mouth_frame_re = re.search('\/(\d+)\.\w+$', last_mouth_frame_path)
    last_mouth_frame_number = 0
    if last_mouth_frame_re:
        last_mouth_frame_number = int(last_mouth_frame_re.group(1))


    for frame_path in glob_frames_sorted:
        frame_number = int(re.search('\/thumb(\d+)\.\w+$', frame_path).group(1))
        if (last_mouth_frame_number >= frame_number):
            continue

        if frame_number % 5 == 0 or frame_number == 1:
            print(('Processing Video ' + OKBLUE + '#{}/{}' + ENDC + ' - {}, frame_number: ' + OKBLUE + '{}/{}' + ENDC).format(num + 1, len(videos_names), video_name, frame_number, len(glob_frames)))

        prepare_img(frame_path)
        dots = get_face_dots(frame_path)

        if len(dots) == 0:
            continue

        # bound губ, определенный opencv
        mouth_bound = cv2.boundingRect(np.array(dots[-20:]))
        # bound губ нормализованных для нас
        mouth_bound = get_normalize_mouth_bound(mouth_bound)
        # вырезанное изображение губ
        img = cv2.imread(frame_path, 1)
        roi = img[mouth_bound[1]:mouth_bound[1] + mouth_bound[3], mouth_bound[0]:mouth_bound[0] + mouth_bound[2]]

        cv2.imwrite(os.path.join(mouth_frames_folder, str(frame_number) + '.jpg'), roi)

    create_file(mouth_frames_data_ok_file)

    #cv2.destroyAllWindows()
