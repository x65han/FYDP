import axios from 'axios';
import { Platform } from 'react-native';

class Uploader {
    private url: string = 'https://mudio.herokuapp.com/upload'

    get_file_name_from_path(uri: string) {
        const tokens = uri.split('/')
        return tokens[tokens.length - 1]
    }

    async submit(file: any, isVideo: boolean) {
        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
            type: isVideo ? 'video/mov' : 'image/jpeg',
            name: this.get_file_name_from_path(file.uri)
        });

        try {
            const res = await axios.post(this.url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent: any) => {
                    const { loaded, total } = progressEvent

                    if (loaded && total) {
                        const percentage = Math.round((parseInt(loaded) * 100) / parseInt(total))
                        console.log('percentage', percentage)
                    }
                }
            });

            const { fileName, filePath } = res.data;

            console.log('uploaded the following', fileName, filePath)
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
