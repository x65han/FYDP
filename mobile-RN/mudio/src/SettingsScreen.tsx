import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import ColorUtil from './services/ColorUtil';


export default class SettingsPage extends React.Component {
  static navigationOptions = ({ navigation }: NavigationScreenProps): NavigationStackScreenOptions => ({
    title: 'Settings',
    headerStyle: { backgroundColor: ColorUtil.GRAY }
  });

  render() {
    return (
      <View style={styles.root}>
        <Text>Settings page</Text>
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
