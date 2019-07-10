import os
import subprocess
import tarfile
import requests

def get_all_files_from_dir(directory):

    '''
    # Functionality
    Get the whole list of files in a folder
	# Arguments
		directory: string.  (e.g.,Users/laowang/~vgg/data/flowers/102/102flowers.tgz)
	# Returns
		None
	'''
    file_paths = []
    for root, dirs, files in os.walk(directory):
        file_paths += [os.path.join(root, x) for x in files]
    return file_paths


def read_raw_from_tar(tar_fn, fn):
	'''
	# Functionality
		Read a specific member file in the archived TAR file
	# Arguments
		tar_fn: string. The local file location of the tar file. (e.g., 102flowers.tgz)
		fn: 	string. The reletive file location inside the tar. (e.g., jpg/image_00001.jpg)
	# Returns
		raw bytes of the member file. (<class 'bytes'>)
	'''
	with tarfile.open(tar_fn) as f:
	    m = f.getmember(fn)
	    return f.extractfile(m).read()


def get_all_filenames_from_tar(tar_fn):
	'''
	# Functionality
		Read filenames directly from tar
	# Arguments
		tar_fn: string. The local file location of the tar file. (e.g., 102flowers.tgz)
	# Returns
		list of file names in the tar
	'''
	with tarfile.open(tar_fn) as f:
		return [m.name for m in f.getmembers() if m.isfile()]


def save_pickle(obj, fn):
	'''
	# Functionality
		Save the data into pickle format
	# Arguments
		obj: the data object
		fn: the pickle file name
	# Returns
		Nothing. Just save to the file.
	'''
	with open(fn, "wb") as f:
		pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)


def read_pickle(fn):

	'''
	# Functionality
		Save the data into pickle format
	# Arguments
		fn: the pickle file name
	# Returns
		obj: the desired data object
	'''
	with open(fn, "rb") as f:
		return pickle.load(f)
