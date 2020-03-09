import React from 'react';
import {
  StyleSheet, View,
  FlatList, Dimensions,
  TouchableOpacity,
  Text, SafeAreaView
} from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
} from 'react-navigation';
import { RouteConfig, RouteParams } from './Router';
import { Consumer, ApplicationState, Session, DataHelper, mutators } from './data';
import HistoryListItem from './components/HistoryListItem';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import ColorUtil from './services/ColorUtil';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions'
import TimestampUtil from './services/TimestampUtil';

const deviceWidth = Dimensions.get('window').width;

interface Props extends NavigationScreenProps { }

export default class HistoryListScreen extends React.Component<Props> {
  static navigationOptions = ({
    navigation,
  }: NavigationScreenProps): NavigationStackScreenOptions => ({
    title: 'Mudio',
    headerStyle: { backgroundColor: ColorUtil.GRAY },
    headerRight: (
      <TouchableOpacity
        onPress={async () => {
          // navigation.push(RouteConfig.SettingsScreen)
          const _ = await Permissions.askAsync(Permissions.CAMERA_ROLL);
          let pickerResult = await ImagePicker.launchImageLibraryAsync();
          const sessionKey = TimestampUtil.generateTimestamp();
          const uri = pickerResult.uri;
          const isVideo = false;
          await mutators.savePhoto({ sessionKey, uri, isVideo });

          const session: Session = DataHelper.createNewSession(uri, isVideo)

          navigation.push(RouteConfig.UploadScreen, {
            [RouteParams.sessionKey]: sessionKey,
            [RouteParams.session]: session,
          })
        }}
        style={styles.settingsButton}
      >
        <FontAwesome name="cloud-upload" size={26} color="black" />
      </TouchableOpacity>
    ),
  });

  private onPressItem = (sessionKey: string, session: Session) => {
    this.props.navigation.navigate(RouteConfig.PlaylistScreen, {
      [RouteParams.sessionKey]: sessionKey,
      [RouteParams.session]: session,
    });
  };

  render() {
    return (
      <View style={styles.root}>
        <Consumer>
          {(state: ApplicationState) =>
            state.history.length ? (
              <FlatList
                data={state.history}
                keyExtractor={(i: string, index) => i + index}
                renderItem={({ item }) => (
                  <HistoryListItem
                    sessionKey={item}
                    session={state.dictionary[item]}
                    onPress={this.onPressItem}
                  />
                )}
              />
            ) : (
                <View style={styles.empty} >
                  <MaterialCommunityIcons
                    name="flask-empty-outline"
                    size={deviceWidth / 2}
                    color="black"
                  />
                  <Text style={{ fontSize: 38 }}>No History</Text>
                </View>
              )}
        </Consumer>

        < SafeAreaView style={styles.floatingContainer}>
          <TouchableOpacity
            onPress={() => {
              this.props.navigation.navigate('CameraStack')
            }}>
            <FontAwesome
              name="plus-circle"
              size={100}
              color="green"
            />
          </TouchableOpacity>
        </SafeAreaView>
      </View >
    );
  }
}

const styles = StyleSheet.create({
  floatingContainer: {
    borderRadius: 50,
    bottom: 15,
    flex: 1,
    flexDirection: 'column',
    left: deviceWidth / 2 - 50,
    position: 'absolute',
    shadowColor: 'gray',
    shadowOpacity: 1.0,
    shadowRadius: 40
  },
  root: {
    flex: 1,
    backgroundColor: ColorUtil.WHITE
  },
  separator: {
    backgroundColor: ColorUtil.GRAY,
    height: 0,
  },
  settingsButton: {
    paddingHorizontal: 10,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
