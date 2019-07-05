import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import ColorUtil from './services/ColorUtil';
import { RouteParams } from './Router';

interface Props extends NavigationScreenProps { }

export default class PlaylistScreen extends React.Component<Props> {
  static navigationOptions = ({ navigation }: NavigationScreenProps): NavigationStackScreenOptions => ({
    title: 'Playlist',
    headerStyle: { backgroundColor: ColorUtil.GRAY }
  });

  render() {
    return (
      <View style={styles.root}>
        <Text>Playlist page {this.props.navigation.getParam(RouteParams.sessionKey)}</Text>
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
