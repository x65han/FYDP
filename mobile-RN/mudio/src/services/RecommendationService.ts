import axios from 'axios';
import { Session } from '../data';
import Uploader from './Uploader';
import { SERVER_URL } from '../Root'

class RecommendationService {
    public async getRecommendation(session: Session) {
        const file_name = Uploader.get_file_name_from_path(session.uri)
        //const res = await axios.get(SERVER_URL + '/recommend/' + file_name)

        let res = {
          image2text: "a black and white photo of a person taking a picture of himself",
          img_url: "http://localhost:5000/uploads/background.png",
          playlist: [
            {
              artist: "Rae Sremmurd",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000001.jpg?raw=true",
              name: "Black Beattles",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000001.mp3?raw=true"
            },
            {
              artist: "The Weekend",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000003.jpg?raw=true",
              name: "Starboy",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000003.mp3?raw=true"
            },
            {
              artist: "Ed Sheeran",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000004.jpg?raw=true",
              name: "Supermarket Flowers",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000004.mp3?raw=true"
            },
            {
              artist: "Rae Sremmurd",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000001.jpg?raw=true",
              name: "Black Beattles",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000001.mp3?raw=true"
            },
            {
              artist: "The Weekend",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000003.jpg?raw=true",
              name: "Starboy",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000003.mp3?raw=true"
            },
            {
              artist: "Ed Sheeran",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000004.jpg?raw=true",
              name: "Supermarket Flowers",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000004.mp3?raw=true"
            },
            {
              artist: "Rae Sremmurd",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000001.jpg?raw=true",
              name: "Black Beattles",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000001.mp3?raw=true"
            },
            {
              artist: "The Weekend",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000003.jpg?raw=true",
              name: "Starboy",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000003.mp3?raw=true"
            },
            {
              artist: "Ed Sheeran",
              coverImage: "https://github.com/y276lin/FYDP-static-assets/blob/master/000004.jpg?raw=true",
              name: "Supermarket Flowers",
              uri: "https://github.com/y276lin/FYDP-static-assets/blob/master/000004.mp3?raw=true"
            }
          ]
        }

        const status = res.status
        const playlists = res.playlist

        console.log('[RecommendationService][1/2]', status, file_name)
        console.log('[RecommendationService][2/2]', playlists)

        return playlists
    }
}

export default new RecommendationService()
