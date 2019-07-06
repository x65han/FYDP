import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import RecommendationService from './services/RecommendationService';
import ColorUtil from './services/ColorUtil';
import { RouteParams } from './Router';
import { Session } from './data';

interface Props extends NavigationScreenProps { }

interface State {
  playlist: Array<string>,
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
    console.log('....... component will mount......')
    console.log(this.state.hasPlaylist)
    if (this.state.hasPlaylist === true) return

    console.log('Getting recommendation')
    const session: Session = this.props.navigation.getParam(RouteParams.session)
    const playlist = await RecommendationService.getRecommendation(session)

    this.setState({ playlist, hasPlaylist: true })
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
