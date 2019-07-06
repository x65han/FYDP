import { createStackNavigator } from 'react-navigation';
import HistoryListScreen from './HistoryListScreen';
import SettingsScreen from './SettingsScreen';
import PlaylistScreen from './PlaylistScreen';
import CameraScreen from './CameraScreen';
import UploadScreen from './UploadScreen';

export enum RouteConfig {
  HistoryListScreen = 'HistoryListScreen',
  SettingsScreen = 'SettingsScreen',
  CameraScreen = 'CameraScreen',
  PlaylistScreen = 'PlaylistScreen',
  UploadScreen = 'UploadScreen',
}

export enum RouteParams {
  sessionKey = 'sessionKey',
  session = 'session',
}

export default createStackNavigator(
  {
    Main: createStackNavigator({
      [RouteConfig.HistoryListScreen]: HistoryListScreen,
      [RouteConfig.SettingsScreen]: SettingsScreen,
      [RouteConfig.PlaylistScreen]: PlaylistScreen,
    }),
    CameraStack: createStackNavigator({
      [RouteConfig.CameraScreen]: CameraScreen,
      [RouteConfig.UploadScreen]: UploadScreen,
    })
  },
  {
    mode: 'card',
    headerMode: 'none',
  }
);
