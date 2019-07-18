import cv2
import numpy as np


import cv2
import numpy as np


def decode_image_from_raw_bytes(raw_bytes):
	'''
	# Functionality
		Convert raw bytes image to numpy array
	# Arguments
		raw_bytes: <class 'bytes'>.  Raw bytes format of image. (e.g., directly read from tar file member)
	# Returns
		numpy array image
	'''
	img = cv2.imdecode(np.asarray(bytearray(raw_bytes), dtype=np.uint8), 1)
	img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
	return img



def image_center_crop(img):
	'''
	# Functionality
		Crop the center of the image based on the shorter side of the image
	# Arguments
		img: numpy array image
	# Returns
		[min(h, w), min(h, w), 3] output with same width and height.
	'''

	h, w, c = img.shape

	horiz_start = int((w/2) - (min(h, w) / 2))
	horiz_end = int((w/2) + (min(h, w) / 2))

	vert_start = int((h/2) - (min(h, w) / 2))
	vert_end = int((h/2) + (min(h, w) / 2))

	cropped_img =  img[vert_start:vert_end, horiz_start:horiz_end, :]

	# checks for errors
	h, w, c = img.shape
	assert cropped_img.shape == (min(h, w), min(h, w), c), "error in image_center_crop!"

	return cropped_img
