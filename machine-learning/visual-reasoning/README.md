# Mudio Image Captioning Pipeline

### Motivation
The overall objective of Mudio is to extract the semantics and emotions from short videos and pass them to the user in the form of music and melody. 
With Mudio, the visually impaired will be able to admire the scenery in front of them instead of simply detecting where the objects are. 
Mudio provides a chance for the visually impaired to perceive the world comprehensively, which might potentially reduce the likelihood of mental illness due to the loss of sight.

This pipeline is the first Deep Learning component of this project, which aims to generate reasonable text description for the 
input images.

### Our R&D Interface
To facilitate the convenience of Research and Development in this pipeline, 3 notebooks are carefully designed:
1. **Update Training Gym** :  We have a ton of images in COCO dataset 2014 but we want to start by overfitting a small portion of the data to make sure our neural net makes sense. We should gradually adding more data into the training process to make the performance better. We prefer the data to be in zip format on the google cloud for easy access.
2. **Update Embeddings** :  First get the downloaded data. Then generate New image embeddings and store in google drive in a pickle format. Again, We should gradually adding more data
3. **Train and Inference Notebook** :  We can set up the encoder-decoder architecture, train and forward pass in the notebook cells.
3. **Train and Inference OOP** :  We can also wrap all the model-related operations in a simple class, just as keras.applications. This setting will make non-ML team members to R&D more quickly without considering too much details.

### Research & Development contributors: 
Yuanxin(Michael) Wang

Undergraduate Research Assistant @ [UWaterloo NLP Lab](https://ov-research.uwaterloo.ca/NLP_lab.html)

[Follow on Github](https://github.com/MichaelYxWang)

[Connect on Linkedin](https://www.linkedin.com/in/michael-yuanxin-wang/)


### References
**[1]** Coursera AML Specialization[[link]](
https://www.coursera.org/specializations/aml)

**[2]** COCO 2014 Dataset[[link]](
http://cocodataset.org/#home)

**[3]** A picture is worth a thousand (coherent) words: building a natural description of images[[link]](
https://ai.googleblog.com/2014/11/a-picture-is-worth-thousand-coherent.html)
