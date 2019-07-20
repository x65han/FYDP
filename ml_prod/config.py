config = dict(
    vocabulary_freq_threshold = 3,          # What is the minimum freq for a word to be in the vocabulary list
    img_embed_size = 2048,                  # Dimension of image embedding vector,determined by CNN Architecture
    img_embed_bottleneck = 120,             # Dimension of image embedding bottleneck layer. Bottleneck used to reduce computation cost
    word_embed_size = 100,                  # Word vector dimension
    lstm_units = 300,                       # LSTM units
    logit_bottleneck = 120,                 # Logit bottleneck layer dimension
    batch_size = 64,                        # batch size
    n_epochs = 50,                          # number of epochs
    n_batches_per_epoch = 1000,             # number of batches to forward pass per epoch
    n_validation_batches = 100,             # how many batches are used for validation each epoch
    img_size = 299,                         # input image size for the encoder
    max_len_sentence = 20                   # Max length of caption. We truncate or pad based on this
)
