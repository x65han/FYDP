import os
import subprocess
import tarfile


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


def download_files(url):
	'''
	# Functionality
		Download web files to the current folder
	# Arguments
		url: string. The url of the web file to download. (e.g., http://www.robots.ox.ac.uk/~vgg/data/flowers/102/102flowers.tgz)
	# Returns
		None
	'''
	pipe = subprocess.Popen(["wget", url])
	pipe.communicate()


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
