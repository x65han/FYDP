import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import RecommendationService from './services/RecommendationService';
import ColorUtil from './services/ColorUtil';
import { RouteParams } from './Router';
import { Session, Playlist } from './data';
import { Audio } from 'expo-av';

interface Props extends NavigationScreenProps { }

interface State {
  playlist: Array<Playlist>,
  hasPlaylist: boolean,
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
    const playlist = await RecommendationService.getRecommendation(session)

    this.setState({ playlist, hasPlaylist: true })
    const soundObject = new Audio.Sound();
    console.log('1 ////// 3')
    await soundObject.loadAsync({uri:'https://github.com/y276lin/FYDP-static-assets/blob/master/000002.mp3?raw=true'});
    console.log('2 ////// 3')
    await soundObject.playAsync();
    console.log('3 ////// 3')
  }

  render() {
    return (
      <View style={styles.root}>
        <Text>Playlist page {this.props.navigation.getParam(RouteParams.sessionKey)}</Text>
        <Text>{JSON.stringify(this.state.playlist)}</Text>
      </View >
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ColorUtil.WHITE
  },
});
