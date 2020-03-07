from ml_prod.utils.file_utils import *
# from ml_prod.utils.image_utils import *
# from ml_prod.utils.generator_utils import *
# from ml_prod.utils.tqdm_utils import *
# from ml_prod.utils.keras_utils import *
# from ml_prod.nli_models import InferSent

from ml_prod.utils.file_utils import *
from ml_prod.nli_models import InferSent

import shutil
import pickle
import os
import numpy as np
import random
import nltk
nltk.download('punkt')
import torch
from pprint import pprint

ROOT_DIR = "./ml_prod/"
DATASET_DIR = ROOT_DIR + "Dataset/"

def build_nli_net():
  V = 2
  MODEL_PATH = ROOT_DIR + 'nli_utils/encoder/infersent%s.pkl' % V
  params_model = {'bsize': 64, 'word_emb_dim': 300, 'enc_lstm_dim': 2048,
                  'pool_type': 'max', 'dpout_model': 0.0, 'version': V}
  infersent = InferSent(params_model)
  infersent.load_state_dict(torch.load(MODEL_PATH))
  return infersent


def cosine(u, v):
  # compute the similarity between two embeddings
  # u and v are matrices!
    return np.einsum('ij,ij->i', u, v) / ((np.linalg.norm(u, axis=1) * np.linalg.norm(v, axis=1)))


def compute_score(caption, num_songs, infersent):
  song_emb_files = get_all_files_from_dir(DATASET_DIR + "song_embeds/")
  scores = []

  caption_emb = infersent.encode([caption])
  for index, file_name in enumerate(song_emb_files):
    song_emb = np.load(file_name)
    # Mean or max score for each song
    score = np.max(cosine(np.repeat(caption_emb, song_emb.shape[0], axis=0), song_emb))
    scores.append(score)
  return sorted(range(len(scores)), key=lambda i: scores[i])[-num_songs:]

def nli_predict(caption, num_songs):
  infersent = build_nli_net()
  W2V_PATH = ROOT_DIR + 'nli_utils/fastText/crawl-300d-2M.vec'
  infersent.set_w2v_path(W2V_PATH)
  infersent.build_vocab_k_words(K=100000)

  song_indices = compute_score(caption, num_songs=num_songs, infersent=infersent)

  print(song_indices)
  return song_indices
