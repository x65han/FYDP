from utils.file_utils import *
from utils.image_utils import *
from utils.generator_utils import *
from utils.tqdm_utils import *
from utils.keras_utils import *

from config import config
from model import *

import os
import tensorflow as tf
from tensorflow.contrib import keras
import numpy as np
%matplotlib inline
import matplotlib.pyplot as plt
L = keras.layers
K = keras.backend
import time
import zipfile
import json
from collections import defaultdict
import re
import random
from random import choice
import collections
import pickle
# tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
import warnings
warnings.filterwarnings('ignore')


with open('vocab.json', 'r') as fp:
    vocab = json.load(fp)
model = Model(config=config, vocab=vocab, input_data=None, pad_idx=vocab["#PAD#"], checkpoint_epoch=49)
model.inference(cv2.imread("boats-2758962__340.jpg"))
