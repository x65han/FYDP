import axios from 'axios';
import { Platform } from 'react-native';
import { SERVER_URL } from '../Root'

class Uploader {
    get_file_name_from_path(uri: string) {
        const tokens = uri.split('/')
        return tokens[tokens.length - 1]
    }

    get_file_type(uri: string) {
        const tokens = uri.split('/')
        const ext = tokens[tokens.length - 1]
        return ext === 'jpg' ? 'image/jpeg' : 'video/mov'
    }

    humanFileSize(bytes: number, si = false) {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    }

    async submit(uri: string, callback = (progress: number) => { }) {
        callback(0)

        const formData = new FormData();
        formData.append('file', {
            // @ts-ignore
            uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
            type: this.get_file_type(uri),
            name: this.get_file_name_from_path(uri)
        });

        try {
            const res = await axios.post(SERVER_URL + '/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent: any) => {
                    const { loaded, total } = progressEvent

                    if (loaded && total) {
                        const progress = Math.round((parseInt(loaded) * 100) / parseInt(total))
                        callback(progress)
                    }
                }
            });

            const { fileName, filePath } = res.data;
            const fullPath = SERVER_URL + filePath

            console.log('uploaded the following', fileName, fullPath)
        } catch (err) {
            if (err.response.status === 500) {
                console.log('There was a problem with the server. Upload failed')
            } else {
                console.log('[Uploader] Failed:', err.response.data.msg);
            }
        }
    }
}

export default new Uploader()
