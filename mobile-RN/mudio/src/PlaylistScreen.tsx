import React from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableHighlight, Slider, Platform } from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import RecommendationService from './services/RecommendationService';
import ColorUtil from './services/ColorUtil';
import { RouteParams } from './Router';
import { Session, Playlist } from './data';
import { Audio, Video } from 'expo-av';
import { AntDesign } from '@expo/vector-icons';

interface Props extends NavigationScreenProps { }

interface State {
  playlist: Array<Playlist>,
  hasPlaylist: boolean,
}

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.index = 0;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.playbackInstance = null;
    this.state = {
      playbackInstanceName: "loading...",
      playbackInstancePosition: null,
      playbackInstanceDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isLoading: true,
      volume: 1.0,
    };
  }

  componentDidMount() {
    Audio.setAudioModeAsync({
      staysActiveInBackground: false,
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  }

  mountVideo = component => {
    this.video = component;
    this.loadNewPlaybackInstance(false);
  };

  async loadNewPlaybackInstance(playing) {
    if (this.playbackInstance != null) {
      await this.playbackInstance.unloadAsync();
      this.playbackInstance.setOnPlaybackStatusUpdate(null);
      this.playbackInstance = null;
    }

    const source = { uri: this.props.myPlaylist[this.index].url };
    const initialStatus = {
      shouldPlay: playing,
      volume: this.state.volume,
    };

    const { sound, status } = await Audio.Sound.create(
      source,
      initialStatus,
      this.onPlaybackStatusUpdate
    );
    this.playbackInstance = sound;
    this.updateScreenForLoading(false);
  }

  updateScreenForLoading(isLoading) {
    if (isLoading) {
      this.setState({
        isPlaying: false,
        playbackInstanceName: "loading...",
        playbackInstanceDuration: null,
        playbackInstancePosition: null,
        isLoading: true,
      });
    } else {
      this.setState({
        playbackInstanceName: this.props.myPlaylist[this.index].name,
        isLoading: false,
      });
    }
  }

  onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      this.setState({
        playbackInstancePosition: status.positionMillis,
        playbackInstanceDuration: status.durationMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        volume: status.volume,
      });

      if (status.didJustFinish) {
        this.advanceIndex(true);
        this.updatePlaybackInstanceForIndex(true);
      }
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  onLoadStart = () => {
    console.log(`ON LOAD START`);
  };

  onLoad = status => {
    console.log(`ON LOAD : ${JSON.stringify(status)}`);
  };

  onError = error => {
    console.log(`ON ERROR : ${error}`);
  };

  advanceIndex(forward) {
    this.index = (this.index + (forward ? 1 : this.props.myPlaylist.length - 1)) % this.props.myPlaylist.length;
  }

  async updatePlaybackInstanceForIndex(playing) {
    this.updateScreenForLoading(true);
    this.loadNewPlaybackInstance(playing);
  }

  onPlayPausePressed = () => {
    if (this.playbackInstance != null) {
      if (this.state.isPlaying) {
        this.playbackInstance.pauseAsync();
      } else {
        this.playbackInstance.playAsync();
      }
    }
  };

  onForwardPressed = () => {
    if (this.playbackInstance != null) {
      this.advanceIndex(true);
      this.updatePlaybackInstanceForIndex(this.state.shouldPlay);
    }
  };

  onBackPressed = () => {
    if (this.playbackInstance != null) {
      this.advanceIndex(false);
      this.updatePlaybackInstanceForIndex(this.state.shouldPlay);
    }
  };

  onSeekSliderValueChange = value => {
    if (this.playbackInstance != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.playbackInstance.pauseAsync();
    }
  };

  onSeekSliderSlidingComplete = async value => {
    if (this.playbackInstance != null) {
      this.isSeeking = false;
      const seekPosition = value * this.state.playbackInstanceDuration;

      if (this.shouldPlayAtEndOfSeek) {
        this.playbackInstance.playFromPositionAsync(seekPosition);
      } else {
        this.playbackInstance.setPositionAsync(seekPosition);
      }
    }
  };

  getSeekSliderPosition() {
    if (
      this.playbackInstance != null &&
      this.state.playbackInstancePosition != null &&
      this.state.playbackInstanceDuration != null
    ) {
      return this.state.playbackInstancePosition / this.state.playbackInstanceDuration;
    }
    return 0;
  }

  getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = number => {
      const string = number.toString();
      if (number < 10) {
        return '0' + string;
      }
      return string;
    };
    return padWithZero(minutes) + ':' + padWithZero(seconds);
  }

  getTimestamp() {
    if (
      this.playbackInstance != null &&
      this.state.playbackInstancePosition != null &&
      this.state.playbackInstanceDuration != null
    ) {
      return `${this.getMMSSFromMillis(this.state.playbackInstancePosition)}`;
    }
    return '';
  }

  private renderPlayer = () => {
    return (
      <View style={styles.bgContainer}>
        <View style={{flex: 1}}>
          <View style={{alignItems: 'center'}}>
            <Text style={styles.title}>{this.state.playbackInstanceName}</Text>
          </View>
          <View style={styles.progressStyle}>
            <Text style={{width: 35, fontSize: 11, color: ColorUtil.BLACK, marginLeft: 5}}>{this.getTimestamp()}</Text>
            <Slider
              style={styles.slider}
              value={this.getSeekSliderPosition()}
              minimumTrackTintColor="#AFA"
              maximumTrackTintColor="#CBC"
              disabled={this.state.isLoading}
              onValueChange={this.onSeekSliderValueChange}
              onSlidingComplete={this.onSeekSliderSlidingComplete}
            />
            <View style={{width: 35, alignItems: 'flex-end', marginRight: 5}}>
              <Text style={{fontSize: 11, color: ColorUtil.BLACK}}>{this.getMMSSFromMillis(this.state.playbackInstanceDuration)}</Text>
            </View>
          </View>
          <View style={styles.toolBar}>
            <View style={styles.cdStyle}>
              <TouchableHighlight
                onPress={this.onBackPressed}
                disabled={this.state.isLoading}
              >
                <AntDesign name={'stepbackward'} size={35} color="#000"/>
              </TouchableHighlight>
              <TouchableHighlight
                style={{width: 35, height: 35, borderRadius: 20, borderWidth: 1, borderColor: ColorUtil.BLACK, justifyContent: 'center', alignItems: 'center'}}
                onPress={this.onPlayPausePressed}
                disabled={this.state.isLoading}
              >
                <AntDesign name={this.state.isPlaying ? 'pause' : 'caretright'} size={20} color="#000"/>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={this.onForwardPressed}
                disabled={this.state.isLoading}
              >
                <AntDesign name={'stepforward'} size={25} color="#000"/>
              </TouchableHighlight>
            </View>
          </View>
        </View>
        <Video ref={this.mountVideo}
          onPlaybackStatusUpdate={this.onPlaybackStatusUpdate}
          onLoadStart={this.onLoadStart}
          onLoad={this.onLoad}
          onError={this.onError}
        />
      </View>
    )
  }

  render() {
    let data = this.props.myPlaylist[this.index]
    return (
      data.url ?
        <View style={styles.container}>
          {this.renderPlayer()}
        </View> : <View/>
    )
  }
}

export default class PlaylistScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationScreenProps): NavigationStackScreenOptions => ({
    title: 'Playlist',
    headerStyle: { backgroundColor: ColorUtil.GRAY }
  });

  state: State = {
    hasPlaylist: false,
    playlist: [],
  }

  public async componentWillMount() {
    if (this.state.hasPlaylist === true) return

    const session: Session = this.props.navigation.getParam(RouteParams.session)
    //const playlist = await RecommendationService.getRecommendation(session)
    const mockData = require('./musicList.json')
    const playlist = mockData.songs
    //const soundObject = new Audio.Sound()

    this.setState({ playlist, hasPlaylist: true })
  }

  render() {
    return (
      <View style={styles.root}>
        <Text>Playlist page {this.props.navigation.getParam(RouteParams.sessionKey)}</Text>
        <Text>{JSON.stringify(this.state.playlist)}</Text>
        <Player myPlaylist={this.state.playlist}/>
      </View >
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ColorUtil.WHITE
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  bgContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  title: {
    color: ColorUtil.BLACK,
    fontSize: 14
  },
  progressStyle: {
    flexDirection: 'row',
    marginHorizontal: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 80
  },
  slider: {
    flex: 1,
    marginHorizontal: 5,
  },
  toolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'absolute',
    bottom: 0,
    marginVertical: 30
  },
  cdStyle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  }
});
