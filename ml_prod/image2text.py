from ml_prod.utils.file_utils import *
from ml_prod.utils.image_utils import *
from ml_prod.utils.generator_utils import *
from ml_prod.utils.tqdm_utils import *
from ml_prod.utils.keras_utils import *

from ml_prod.config import config
from ml_prod.model import *

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


with open('./ml_prod/vocab.json', 'r') as fp:
    vocab = json.load(fp)

model = Model(config=config, vocab=vocab, input_data=None, pad_idx=vocab["#PAD#"], checkpoint_epoch=49)
# model.inference(cv2.imread("./ml-prod/boats-2758962__340.jpg"), plot=False)
