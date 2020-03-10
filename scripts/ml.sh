source activate tensorflow_p36
pip install torch torchvision
cd ml_prod
mkdir nli_utils
cd nli_utils
mkdir encoder
mkdir fastText
curl -Lo fastText/crawl-300d-2M.vec.zip https://dl.fbaipublicfiles.com/fasttext/vectors-english/crawl-300d-2M.vec.zip
unzip fastText/crawl-300d-2M.vec.zip -d fastText/
curl -Lo encoder/infersent2.pkl https://dl.fbaipublicfiles.com/infersent/infersent2.pkl
