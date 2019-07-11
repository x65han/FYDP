iimport os
import numpy as np
from tensorflow.contrib import keras
import re
L = keras.layers
K = keras.backend
import tensorflow as tf
import threading
import json
import google.colab as colab
import cv2
import zipfile
import pickle
import collections
import random


class Model(object):

    def __init__(self, config):

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

        self.build_model()

    def build_model(self):
        print("Building Model Now...")

        self.init_placeholders()
        self.build_encoder()
        self.build_decoder()
        self.loss()
        self.optimize()
        self.summary()

    def init_placeholders(self):
        with tf.name_scope("model_inputs"):
            # Create palceholders for inputs to the model
            self.input_images = tf.placeholder('float32', [1, IMG_SIZE, IMG_SIZE, 3], name='images')
            self.img_embeds = tf.placeholder('float32', [None, self.img_embed_size])        # [batch_size, IMG_EMBED_SIZE] of CNN image features
            self.sentences = tf.placeholder('int32', [None, None])                          # [batch_size, time steps] of word ids
            self.current_word = tf.placeholder('int32', [1], name='current_input')          # current word index


    def build_encoder(self):
        with tf.name_scope("encode"):
            K.set_learning_phase(False)
            # We can also try resnet, wide-resnet, etc...
            encoder = keras.applications.InceptionV3(include_top=False)
            self.encoder = keras.models.Model(encoder.inputs, keras.layers.GlobalAveragePooling2D()(encoder.output))


    def build_decoder(self):
        with tf.variable_scope("decode"):
            for layer in range(self.num_layers):
                with tf.variable_scope('decoder_{}'.format(layer + 1)):
                    dec_cell = tf.contrib.rnn.LayerNormBasicLSTMCell(2 * self.lstm_hidden_units)
                    dec_cell = tf.contrib.rnn.DropoutWrapper(dec_cell, input_keep_prob=self.keep_prob)

            self.output_layer = Dense(self.vocab_size)

            self.init_state = dec_cell.zero_state(self.batch_size, tf.float32)

            with tf.name_scope("training_decoder"):
                training_helper = tf.contrib.seq2seq.TrainingHelper(inputs=self.dec_embed_input,
                                                                    sequence_length=self.target_sentence_length,
                                                                    time_major=False)

                training_decoder = basic_decoder.BasicDecoder(dec_cell,
                                                              training_helper,
                                                              initial_state=self.init_state,
                                                              latent_vector=self.z_vector,
                                                              output_layer=self.output_layer)

                self.training_logits, _state, _len = tf.contrib.seq2seq.dynamic_decode(training_decoder,
                                                                                       output_time_major=False,
                                                                                       impute_finished=True,
                                                                                       maximum_iterations=self.num_tokens)

                self.training_logits = tf.identity(self.training_logits.rnn_output, 'logits')

            with tf.name_scope("inference_decoder"):
                start_token = self.word_index['GO']
                end_token = self.word_index['EOS']

                start_tokens = tf.tile(tf.constant([start_token], dtype=tf.int32), [self.batch_size],
                                       name='start_tokens')

                inference_helper = tf.contrib.seq2seq.GreedyEmbeddingHelper(self.embeddings,
                                                                            start_tokens,
                                                                            end_token)

                inference_decoder = basic_decoder.BasicDecoder(dec_cell,
                                                               inference_helper,
                                                               initial_state=self.init_state,
                                                               latent_vector=self.z_vector,
                                                               output_layer=self.output_layer)

                self.inference_logits, _state, _len = tf.contrib.seq2seq.dynamic_decode(inference_decoder,
                                                                                        output_time_major=False,
                                                                                        impute_finished=True,
                                                                                        maximum_iterations=self.num_tokens)

                self.inference_logits = tf.identity(self.inference_logits.sample_id, name='predictions')

    def loss(self):
        with tf.name_scope('losses'):
            self.kl_loss = self.calculate_kl_loss()
            self.kl_loss = tf.scalar_mul(self.lambda_coeff, self.kl_loss)

            # Create the weights for sequence_loss
            masks = tf.sequence_mask(self.target_sentence_length, self.num_tokens, dtype=tf.float32, name='masks')

            self.xent_loss = tf.contrib.seq2seq.sequence_loss(
                self.training_logits,
                self.target_data,
                weights=masks,
                average_across_batch=False)

            # L2-Regularization
            self.var_list = tf.trainable_variables()
            self.lossL2 = tf.add_n([tf.nn.l2_loss(v) for v in self.var_list if 'bias' not in v.name]) * 0.001

            self.cost = tf.reduce_sum(self.xent_loss + self.kl_loss) + self.lossL2

    def optimize(self):
        # Optimizer
        with tf.name_scope('optimization'):
            optimizer = tf.train.AdamOptimizer(self.lr)

            # Gradient Clipping
            gradients = optimizer.compute_gradients(self.cost, var_list=self.var_list)
            capped_gradients = [(tf.clip_by_value(grad, -5., 5.), var) for grad, var in gradients if grad is not None]
            self.train_op = optimizer.apply_gradients(capped_gradients)

    def summary(self):
        with tf.name_scope('summaries'):
            tf.summary.scalar('xent_loss', tf.reduce_sum(self.xent_loss))
            tf.summary.scalar('l2_loss', tf.reduce_sum(self.lossL2))
            tf.summary.scalar("kl_loss", tf.reduce_sum(self.kl_loss))
            tf.summary.scalar('total_loss', tf.reduce_sum(self.cost))
            tf.summary.scalar('lambda', self.lambda_coeff)
            tf.summary.scalar('wd_keep', self.word_dropout_keep_prob)

            tf.summary.histogram("latent_vector", self.z_vector)
            tf.summary.histogram("latent_mean", self.z_mean)
            tf.summary.histogram("latent_log_sigma", self.z_log_sigma)
            self.summary_op = tf.summary.merge_all()


    def train(self, x_train, x_val):

        print('[INFO] Training process started')

        learning_rate = self.initial_learning_rate
        iter_i = 0
        lambda_val = 0.0
        wd_anneal = 1.0

        with tf.Session() as sess:
            sess.run(tf.global_variables_initializer())

            writer = tf.summary.FileWriter(self.logs_dir, sess.graph)

            for epoch_i in range(1, self.epochs + 1):

                start_time = time.time()
                for batch_i, (input_batch, output_batch, sent_lengths) in enumerate(
                        utils.get_batches(x_train, self.batch_size)):

                    try:
                        iter_i += 1

                        _, _summary = sess.run(
                            [self.train_op, self.summary_op],
                            feed_dict={self.input_data: input_batch,
                                       self.target_data: output_batch,
                                       self.lr: learning_rate,
                                       self.source_sentence_length: sent_lengths,
                                       self.target_sentence_length: sent_lengths,
                                       self.keep_prob: self.dropout_keep_prob,
                                       self.lambda_coeff: lambda_val,
                                       self.z_temperature: self.z_temp,
                                       self.word_dropout_keep_prob: wd_anneal,
                                       })

                        writer.add_summary(_summary, iter_i)

                        # KL Annealing till some iteration
                        if iter_i <= self.anneal_till:
                            lambda_val = np.round((np.tanh((iter_i - 4500) / 1000) + 1) / 2, decimals=6)
                            # lambda_val = np.round(logistic.cdf(iter_i/4500) - 0.5, decimals=6)

                    except Exception as e:
                        # print(iter_i, e)
                        pass

                self.validate(sess, x_val)
                val_bleu_str = str(self.epoch_bleu_score_val['1'][epoch_i - 1]) + ' | ' \
                               + str(self.epoch_bleu_score_val['2'][epoch_i - 1]) + ' | ' \
                               + str(self.epoch_bleu_score_val['3'][epoch_i - 1]) + ' | ' \
                               + str(self.epoch_bleu_score_val['4'][epoch_i - 1])

                # Reduce learning rate, but not below its minimum value
                learning_rate = np.max([self.min_learning_rate, learning_rate * self.learning_rate_decay])

                # Anneal word dropout from 1.0 to the limit
                wd_anneal = np.max([self.word_dropout_keep_probability, wd_anneal - 0.05])

                saver = tf.train.Saver()
                saver.save(sess, self.model_checkpoint_dir + str(epoch_i) + ".ckpt")
                end_time = time.time()

                # Save the validation BLEU scores so far
                with open(self.bleu_path + '.pkl', 'wb') as f:
                    pickle.dump(self.epoch_bleu_score_val, f)

                self.log_str.append('Epoch {:>3}/{} - Time {:>6.1f} BLEU: {}'.format(epoch_i,
                                                                                     self.epochs,
                                                                                     end_time - start_time,
                                                                                     val_bleu_str))
                with open('logs.txt', 'w') as f:
                    f.write('\n'.join(self.log_str))
                print(self.log_str[-1])

    def validate(self, sess, x_val):
        # Calculate BLEU on validation data
        hypotheses_val = []
        references_val = []

        for batch_i, (input_batch, output_batch, sent_lengths) in enumerate(
                utils.get_batches(x_val, self.batch_size)):
            answer_logits = sess.run(self.inference_logits,
                                     feed_dict={self.input_data: input_batch,
                                                self.source_sentence_length: sent_lengths,
                                                self.keep_prob: 1.0,
                                                self.word_dropout_keep_prob: 1.0,
                                                self.z_temperature: self.z_temp})

            for pred, actual in zip(answer_logits, output_batch):
                hypotheses_val.append(
                    word_tokenize(
                        " ".join([self.idx_word[i] for i in pred if i not in [self.pad, -1, self.eos]])))
                references_val.append(
                    [word_tokenize(" ".join([self.idx_word[i] for i in actual if i not in [self.pad, -1, self.eos]]))])

        bleu_scores = utils.calculate_bleu_scores(references_val, hypotheses_val)
        self.epoch_bleu_score_val['1'].append(bleu_scores[0])
        self.epoch_bleu_score_val['2'].append(bleu_scores[1])
        self.epoch_bleu_score_val['3'].append(bleu_scores[2])
        self.epoch_bleu_score_val['4'].append(bleu_scores[3])


    def predict(self, checkpoint, x_test):
        pred_logits = []
        hypotheses_test = []
        references_test = []

        with tf.Session() as sess:
            sess.run(tf.global_variables_initializer())
            saver = tf.train.Saver()
            saver.restore(sess, checkpoint)

            for batch_i, (input_batch, output_batch, sent_lengths) in enumerate(
                    utils.get_batches(x_test, self.batch_size)):
                result = sess.run(self.inference_logits, feed_dict={self.input_data: input_batch,
                                                                    self.source_sentence_length: sent_lengths,
                                                                    self.keep_prob: 1.0,
                                                                    self.word_dropout_keep_prob: 1.0,
                                                                    self.z_temperature: self.z_temp})

                pred_logits.extend(result)

                for pred, actual in zip(result, output_batch):
                    hypotheses_test.append(
                        word_tokenize(" ".join(
                            [self.idx_word[i] for i in pred if i not in [self.pad, -1, self.eos]])))
                    references_test.append([word_tokenize(
                        " ".join([self.idx_word[i] for i in actual if i not in [self.pad, -1, self.eos]]))])

            bleu_scores = utils.calculate_bleu_scores(references_test, hypotheses_test)

        print('BLEU 1 to 4 : {}'.format(' | '.join(map(str, bleu_scores))))

        return pred_logits
