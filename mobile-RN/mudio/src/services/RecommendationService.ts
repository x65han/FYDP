import axios from 'axios';
import { Session } from '../data';
import Uploader from './Uploader';
import { SERVER_URL } from '../Root'

class RecommendationService {
    public async getRecommendation(session: Session) {
        const file_name = Uploader.get_file_name_from_path(session.uri)
        const res = await axios.get(SERVER_URL + '/recommend/' + file_name)

        const {status, playlist} = res.data

        console.log('[RecommendationService][1/2]', status, file_name)
        console.log('[RecommendationService][2/2]', playlist)

        return playlist
    }
}

export default new RecommendationService()
