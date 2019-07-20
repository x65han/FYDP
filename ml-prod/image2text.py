from utils.file_utils import *
from utils.image_utils import *
from utils.generator_utils import *
from utils.tqdm_utils import *
from utils.keras_utils import *

from config import config
from model import *

import os, time, zipfile, json, re, random
import collections, pickle, socket
import tensorflow as tf
from tensorflow.contrib import keras
import numpy as np
import matplotlib.pyplot as plt
L = keras.layers
K = keras.backend
from collections import defaultdict
from random import choice
# tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
import warnings
warnings.filterwarnings('ignore')


with open('./ml-prod/vocab.json', 'r') as fp:
    vocab = json.load(fp)

model = Model(config=config, vocab=vocab, input_data=None, pad_idx=vocab["#PAD#"], checkpoint_epoch=49)

#####################################
#####################################
#####################################

HOST = '127.0.0.1'  # Standard loopback interface address (localhost)
PORT = 65432        # Port to listen on (non-privileged ports are > 1023)

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()

    while True:
        conn, addr = s.accept()
        with conn:
            print('Connected by', addr)
            while True:
                data = conn.recv(1024)
                if len(data) == 0:
                    continue
                print('Socket Server received:', data)
                res = model.inference(cv2.imread("./ml-prod/boats-2758962__340.jpg"), plot=False)
                conn.sendall(res.encode())
                break
