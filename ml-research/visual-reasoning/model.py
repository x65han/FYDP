from utils.file_utils import *
from utils.image_utils import *
from utils.generator_utils import *
from utils.tqdm_utils import *
from utils.keras_utils import *

import os
import tensorflow as tf
from tensorflow.contrib import keras
import numpy as np
L = keras.layers
K = keras.backend
import random
import google.colab as colab
import pickle
import matplotlib.pyplot as plt

class Model(object):

    def __init__(self, config, vocab=None, input_data=None, pad_idx=None, checkpoint_epoch=None):

        self.config = config
        self.img_size = config['img_size']
        self.img_embed_size = config['img_embed_size']
        self.img_embed_bottleneck = config['img_embed_bottleneck']
        self.word_embed_size = config['word_embed_size']
        self.lstm_units = config['lstm_units']
        self.logit_bottleneck = config['logit_bottleneck']
        self.batch_size = config['batch_size']
        self.n_epochs = config['n_epochs']
        self.n_batches_per_epoch = config['n_batches_per_epoch']
        self.n_validation_batches = config['n_validation_batches']
        self.max_len_sentence = config['max_len_sentence']
        self.pad_idx = pad_idx
        self.vocab = vocab
        self.checkpoint_epoch = checkpoint_epoch
        self.learning_rate = 0.001
        if input_data:
            self.train_img_embeds, self.train_captions_indexed, self.val_img_embeds, self.val_captions_indexed = input_data


    def init_placeholders(self):
        with tf.name_scope("model_inputs"):
            # Create palceholders for inputs to the model
            self.img_embeds = tf.placeholder('float32', [None, self.img_embed_size])        # [batch_size, IMG_EMBED_SIZE] of CNN image features
            self.sentences = tf.placeholder('int32', [None, None])                          # [batch_size, time steps] of word ids


    def build_train_decoder(self):
        with tf.variable_scope("train_decode"):
            # we use bottleneck here to reduce the number of parameters
            # image embedding -> bottleneck
            self.img_embed_to_bottleneck = L.Dense(self.img_embed_bottleneck,
                                      input_shape=(None, self.img_embed_size),
                                      activation='elu')
            # image embedding bottleneck -> lstm initial state
            self.img_embed_bottleneck_to_h0 = L.Dense(self.lstm_units,
                                         input_shape=(None, self.img_embed_bottleneck),
                                         activation='elu')
            # word -> embedding
            self.word_embed = L.Embedding(len(self.vocab), self.word_embed_size)
            # lstm cell (from tensorflow)
            self.lstm = tf.nn.rnn_cell.LSTMCell(self.lstm_units)

            # we use bottleneck here to reduce model complexity
            # lstm output -> logits bottleneck
            self.token_logits_bottleneck = L.Dense(self.logit_bottleneck,
                                              input_shape=(None, self.lstm_units),
                                              activation="elu")
            # logits bottleneck -> logits for next token prediction
            self.token_logits = L.Dense(len(self.vocab),
                                   input_shape=(None, self.logit_bottleneck))

            # initial lstm cell state of shape (None, LSTM_UNITS),
            # we need to condition it on `img_embeds` placeholder.
            c0 = h0 = self.img_embed_bottleneck_to_h0(self.img_embed_to_bottleneck(self.img_embeds))

            # embed all tokens but the last (last for not be input) for lstm input,
            # remember that L.Embedding is callable,
            # use `sentences` placeholder as input.
            word_embeds = self.word_embed(self.sentences[:, :-1])

            # during training we use ground truth tokens `word_embeds` as context for next token prediction.
            # that means that we know all the inputs for our lstm and can get
            # all the hidden states with one tensorflow operation (tf.nn.dynamic_rnn).
            # `hidden_states` has a shape of [batch_size, time steps, LSTM_UNITS].
            hidden_states, _ = tf.nn.dynamic_rnn(self.lstm, word_embeds,
                                                 initial_state=tf.nn.rnn_cell.LSTMStateTuple(c0, h0))

            # now we need to calculate token logits for all the hidden states
            # first, we reshape `hidden_states` to [-1, LSTM_UNITS]
            flat_hidden_states = tf.reshape(hidden_states, [-1, self.lstm_units])

            # then, we calculate logits for next tokens using `token_logits_bottleneck` and `token_logits` layers
            flat_token_logits = self.token_logits(self.token_logits_bottleneck(flat_hidden_states))

            # then, we flatten the ground truth (output side, compare with word_embeds) token ids.
            # remember, that we predict next tokens for each time step,
            # use `sentences` placeholder.
            flat_ground_truth = tf.reshape(self.sentences[:, 1:], [-1])

            # we need to know where we have real tokens (not padding) in `flat_ground_truth`,
            # we don't want to propagate the loss for padded output tokens,
            # fill `flat_loss_mask` with 1.0 for real tokens (not pad_idx) and 0.0 otherwise.
            self.flat_loss_mask = tf.cast(tf.not_equal(flat_ground_truth, self.pad_idx), 'float32')

            # compute cross-entropy between `flat_ground_truth` and `flat_token_logits` predicted by lstm
            self.xent = tf.nn.sparse_softmax_cross_entropy_with_logits(
                labels=flat_ground_truth,
                logits=flat_token_logits
            )


    def loss(self):
        with tf.name_scope('losses'):
            self.loss = tf.reduce_sum(self.xent*self.flat_loss_mask) / tf.reduce_sum(self.flat_loss_mask)


    def optimize(self):
        with tf.name_scope('optimization'):
            optimizer = tf.train.AdamOptimizer(self.learning_rate)
            self.train_step = optimizer.minimize(self.loss)


    def build_inference_decoder(self):
        with tf.variable_scope("inference_decode"):
            # CNN encoder
            K.set_learning_phase(False)
            encoder = keras.applications.InceptionV3(include_top=False)
            encoder = keras.models.Model(encoder.inputs, keras.layers.GlobalAveragePooling2D()(encoder.output))

            # containers for current lstm state
            lstm_c = tf.Variable(tf.zeros([1, self.lstm_units]), name="cell")
            lstm_h = tf.Variable(tf.zeros([1, self.lstm_units]), name="hidden")

            # input images
            self.input_images = tf.placeholder('float32', [1, self.img_size, self.img_size, 3], name='images')

            # get image embeddings
            img_embeds = encoder(self.input_images)

            # initialize lstm state conditioned on image
            init_c = init_h = self.img_embed_bottleneck_to_h0(self.img_embed_to_bottleneck(img_embeds))
            self.init_lstm = tf.assign(lstm_c, init_c), tf.assign(lstm_h, init_h)

            # current word index
            self.current_word = tf.placeholder('int32', [1], name='current_input')

            # embedding for current word
            word_embed = self.word_embed(self.current_word)

            # apply lstm cell, get new lstm states
            new_c, new_h = self.lstm(word_embed, tf.nn.rnn_cell.LSTMStateTuple(lstm_c, lstm_h))[1]

            # compute logits for next token
            new_logits = self.token_logits(self.token_logits_bottleneck(new_h))
            # compute probabilities for next token
            new_probs = tf.nn.softmax(new_logits)

            # `one_step` outputs probabilities of next token and updates lstm hidden state
            self.one_step = new_probs, tf.assign(lstm_c, new_c), tf.assign(lstm_h, new_h)


    def batch_captions_to_matrix(self, batch_captions, pad_idx, max_len=None):
        """
        `batch_captions` is an array of arrays:
        [
            [vocab[START], ..., vocab[END]],
            [vocab[START], ..., vocab[END]],
            ...
        ]
        Put vocabulary indexed captions into np.array of shape (len(batch_captions), columns),
            where "columns" is max(map(len, batch_captions)) when max_len is None
            and "columns" = min(max_len, max(map(len, batch_captions))) otherwise.
        Add padding with pad_idx where necessary.
        Input example: [[1, 2, 3], [4, 5]]
        Output example: np.array([[1, 2, 3], [4, 5, pad_idx]]) if max_len=None
        Output example: np.array([[1, 2], [4, 5]]) if max_len=2
        Output example: np.array([[1, 2, 3], [4, 5, pad_idx]]) if max_len=100
        Try to use numpy, we need this function to be fast!
        """
        ###YOUR CODE HERE###
        matrix = []

        if max_len:
          max_len = min(max_len, len(max(batch_captions, key=len)))
        else:
          max_len = len(max(batch_captions, key=len))

        for caption in batch_captions:
          if len(caption) < max_len:
            output = caption + [pad_idx] * (max_len-len(caption))
          elif len(caption) > max_len:
            output = caption[:max_len]
          else:
            output = caption
          matrix.append(output)

        return np.array(matrix)


    def generate_batch(self, images_embeddings, indexed_captions):
        """
        `images_embeddings` is a np.array of shape [number of images, IMG_EMBED_SIZE].
        `indexed_captions` holds 5 vocabulary indexed captions for each image:
        [
            [
                [vocab[START], vocab["image1"], vocab["caption1"], vocab[END]],
                [vocab[START], vocab["image1"], vocab["caption2"], vocab[END]],
                ...
            ],
            ...
        ]
        Generate a random batch of size `batch_size`.
        Take random images and choose one random caption for each image.
        Remember to use `batch_captions_to_matrix` for padding and respect `max_len` parameter.
        Return feed dict {decoder.img_embeds: ..., decoder.sentences: ...}.
        """

        indices = np.random.randint(0, len(images_embeddings), self.batch_size)
        batch_image_embeddings = images_embeddings[indices]

        batch_captions = []
        for i in indices:
          all_current_captions = indexed_captions[i]
          cap_idx = np.random.randint(0, len(all_current_captions))
          batch_captions.append(all_current_captions[cap_idx])
        batch_captions_matrix = self.batch_captions_to_matrix(batch_captions, self.pad_idx, self.max_len_sentence)

        return {self.img_embeds: batch_image_embeddings,
                self.sentences: batch_captions_matrix}


    def preprocess(self, input, input_shape=(299, 299)):
        if type(input) is bytes:
          img = decode_image_from_raw_bytes(input)
        else:
          img = input
        img = image_center_crop(img)  # take center crop
        img = cv2.resize(img, input_shape)  # resize for our model
        img = img.astype("float32")  # prepare for normalization
        img = keras.applications.inception_v3.preprocess_input(img)  # preprocess for model
        return img


    def generate_caption(self, image, t=1, sample=False):
        """
        Generate caption for given image.
        if `sample` is True, we will sample next token from predicted probability distribution.
        `t` is a temperature during that sampling,
            higher `t` causes more uniform-like distribution = more chaos.
        """
        max_len = self.max_len_sentence

        # condition lstm on the image
        self.s.run(self.init_lstm,
              {self.input_images: [image]})

        # current caption
        # start with only START token
        caption = [self.vocab["#START#"]]

        for _ in range(max_len):
            next_word_probs = self.s.run(self.one_step,
                                    {self.current_word: [caption[-1]]})[0]
            next_word_probs = next_word_probs.ravel()

            # apply temperature
            next_word_probs = next_word_probs**(1/t) / np.sum(next_word_probs**(1/t))

            if sample:
                next_word = np.random.choice(range(len(self.vocab)), p=next_word_probs)
            else:
                next_word = np.argmax(next_word_probs)

            caption.append(next_word)
            if next_word == self.vocab["#END#"]:
                break
        vocab_inverse = {idx: w for w, idx in self.vocab.items()}
        return list(map(vocab_inverse.get, caption))


    def inference(self, img, plot=True):
        # Setup
        self.s = reset_tf_session()
        tf.set_random_seed(46)
        self.s.run(tf.global_variables_initializer())

        self.init_placeholders()
        self.build_train_decoder()

        # Load the model. Can specify which model later
        checkpoint_path = '/content/gdrive/My Drive/FYDP/captioning/checkpoints/weights_' + str(self.checkpoint_epoch)
        saver = tf.train.Saver()
        saver.restore(self.s, checkpoint_path)

        self.build_inference_decoder()

        # Actual Inference Starts
        if plot:
            fig = plt.figure(figsize=(10, 10))
            plt.grid('off')
            plt.axis('off')
            plt.imshow(img)
            plt.show()

        img = self.preprocess(img)
        print(' '.join(self.generate_caption(img)[1:-1]))


    def train(self):
        # Setup
        self.s = reset_tf_session()
        tf.set_random_seed(46)

        self.init_placeholders()
        self.build_train_decoder()
        self.loss()
        self.optimize()

        # Actual Training Starts
        self.s.run(tf.global_variables_initializer())
        saver = tf.train.Saver()

        for epoch in range(self.n_epochs):
            train_loss = 0
            pbar = tqdm_notebook_failsafe(range(self.n_batches_per_epoch))
            counter = 0
            for _ in pbar:
                train_loss += self.s.run([self.loss, self.train_step],
                                    self.generate_batch(self.train_img_embeds, self.train_captions_indexed))[0]
                counter += 1
                pbar.set_description("Training loss: %f" % (train_loss / counter))

            train_loss /= self.n_batches_per_epoch

            val_loss = 0
            for _ in range(self.n_validation_batches):
                val_loss += self.s.run(self.loss,
                                  self.generate_batch(self.val_img_embeds, self.val_captions_indexed))
            val_loss /= self.n_validation_batches

            print('Epoch: {}, train loss: {}, val loss: {}'.format(epoch, train_loss, val_loss))

            # save weights after finishing epoch
            checkpoint_path = "/content/gdrive/My Drive/FYDP/captioning/checkpoints/weights_" + str(epoch)
            saver.save(self.s, checkpoint_path)

        print("Finished!")
