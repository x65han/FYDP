import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Image } from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import ColorUtil from './services/ColorUtil';
import { DataHelper } from './data';
import { RouteParams, RouteConfig } from './Router';
import { FileSystem } from 'expo';
import Uploader from './services/Uploader'
import { FontAwesome } from '@expo/vector-icons';

interface Props extends NavigationScreenProps { }

interface State {
  progress: number,
  size: number,
  uri: string,
  completed: boolean,
}

export default class UploadScreen extends React.Component<Props, State> {
  state: State = {
    progress: 0,
    size: 0,
    uri: '',
    completed: false,
  }

  static navigationOptions = ({ navigation }: NavigationScreenProps): NavigationStackScreenOptions => ({
    title: 'Uploading',
    headerStyle: { backgroundColor: ColorUtil.GRAY }
  });

  public async componentWillMount() {
    const sessionKey = this.props.navigation.getParam(RouteParams.sessionKey)
    const dir_arr = await FileSystem.readDirectoryAsync(DataHelper.folderPath(sessionKey))

    if (dir_arr.length === 0) {
      throw `No file found in ${sessionKey}/ folder`
    }

    const filePath = DataHelper.folderPath(sessionKey) + dir_arr[0]
    const fileInfo = await FileSystem.getInfoAsync(filePath) as FileSystem.FileInfo

    if (fileInfo.exists === false) {
      throw `File doesn't exists in ${sessionKey}/ folder`
    }

    const { uri, size } = fileInfo
    this.setState({ size, uri })

    await Uploader.submit(uri, (progress: number) => {
      setTimeout(() => {
        if (this.state.completed === true) return;
        this.setState({ progress })

        if (progress === 100) {
          this.setState({ completed: true })
          this.props.navigation.dismiss()

          setTimeout(() => {
            this.props.navigation.push(RouteConfig.PlaylistScreen, {
              [RouteParams.sessionKey]: sessionKey
            })
          }, 1000)
        }
      }, 2000)
    })
  }

  render() {
    return (
      <View style={styles.root}>
        <FontAwesome
          name="upload"
          size={50}
          color="black"
        />
        <ActivityIndicator size="large" color={ColorUtil.BLACK} />
        <Text>{this.state.progress}%</Text>
      </View >
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ColorUtil.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
