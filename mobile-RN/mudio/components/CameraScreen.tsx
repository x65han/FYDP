import React from 'react';
import {
  Text, View, Image,
  StyleSheet, SafeAreaView,
  Dimensions, Switch, TouchableOpacity, AsyncStorage
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  mutators, Session,
  Consumer, FlashMode,
  selectors, CameraSettings
} from './data';
import { NavigationScreenProps } from 'react-navigation';
import { Camera, Permissions, CameraObject, Video } from 'expo';
import TimestampUtil from './services/TimestampUtil';
import { applicationStateKey } from './Root'
import Uploader from './services/Uploader';

enum UiState {
  AskingForPermissions,
  NoPermissions,
  SetAlignmentGuides,
  Capturing,
  ReviewPhoto,
}

const windowDimensions = Dimensions.get('window');
const buttonSize = 48;
const buttonLargeSize = 64;

const flashModeOrder = {
  off: FlashMode.on,
  on: FlashMode.auto,
  auto: FlashMode.torch,
  torch: FlashMode.off,
};
const flashIcons = {
  off: 'flash-off',
  on: 'flash',
  auto: 'flash-auto',
  torch: 'flashlight',
};

interface Props extends NavigationScreenProps { }
interface State {
  uiState: UiState;
  preview?: {
    uri: string;
  };
  cameraRolling: boolean;
  isVideo: boolean;
  sessionKey: string;
}

export default class CameraScreen extends React.Component<Props, State> {
  camera?: CameraObject;

  state: State = {
    uiState: UiState.AskingForPermissions,
    preview: undefined,
    cameraRolling: false,
    isVideo: false,
    sessionKey: TimestampUtil.generateTimestamp()
  };

  async componentDidMount() {
    // Permissions.CAMERA
    const cameraPermission = await Permissions.askAsync(Permissions.CAMERA);
    // Permissions.AUDIO_RECORDING
    const audioPermission = await Permissions.askAsync(Permissions.AUDIO_RECORDING);

    const uiState = (audioPermission.status === 'granted' && cameraPermission.status === 'granted') ? UiState.Capturing : UiState.NoPermissions;
    this.setState({ uiState });

    const rawApplicationState = await AsyncStorage.getItem(applicationStateKey)
    if (rawApplicationState) {
      const applicationState = JSON.parse(rawApplicationState)
      this.setState({isVideo:applicationState.cameraSettings.isVideo})
    }
  }

  private takePhoto = async () => {
    if (this.camera && this.state.isVideo === false) {
      this.setState({ cameraRolling: true });
      try {
        const photo = await this.camera.takePictureAsync();
        this.setState({ preview: photo, uiState: UiState.ReviewPhoto });
      } catch (error) {
      } finally {
        this.setState({ cameraRolling: false });
      }
    }
  };

  private takeVideo = async () => {
    if (this.camera && this.state.isVideo === true) {
      this.setState({ cameraRolling: true });
      try {
        const video = await this.camera.recordAsync({
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: 10
        });
        this.setState({ preview: video, uiState: UiState.ReviewPhoto })
      } catch (error) {
      } finally {
        this.setState({ cameraRolling: false })
      }
    }
  }

  private redoPhoto = () => {
    this.setState({
      preview: undefined,
      uiState: UiState.Capturing,
    });
  };

  private savePhoto = async () => {
    const photoPreview = this.state.preview;
    if (photoPreview === undefined) {
      this.redoPhoto();
      return;
    }

    console.log('saving photo', photoPreview)
    await Uploader.submit(photoPreview, this.state.isVideo)

    try {
      await mutators.savePhoto({
        sessionKey: this.state.sessionKey,
        uri: photoPreview.uri,
        isVideo: this.state.isVideo
      });
    } catch (error) {
      this.redoPhoto();
      return;
    }

    this.props.navigation.goBack();
  };

  private toggleVideoSwitch = (cameraSettings: CameraSettings) => {
    this.setState(prev => {
      this.saveCameraSettings({
        ...cameraSettings,
        isVideo: !prev.isVideo
      })
      return { isVideo: !prev.isVideo }
    })
  }

  private saveCameraSettings(cameraSettings: CameraSettings): void {
    mutators.saveCameraSettings({ cameraSettings })
  }

  render() {
    const { uiState, preview, cameraRolling } = this.state;

    const closeButton = (
      <FontAwesome
        name="close"
        size={buttonSize}
        color="#FFF"
        onPress={() => this.props.navigation.goBack()}
      />
    );

    const topButtons = () => (
      <Consumer select={[selectors.getCameraSettings()]}>
        {(cameraSettings: CameraSettings) => (
          <>
            {this.state.isVideo === false && <MaterialCommunityIcons
              name={flashIcons[cameraSettings.flashMode]}
              color="white"
              size={38}
              style={{
                position: 'absolute',
                top: 60,
                left: 30,
              }}
              onPress={() => {
                this.saveCameraSettings({
                  ...cameraSettings,
                  flashMode: flashModeOrder[cameraSettings.flashMode] as FlashMode
                })
              }}
            />}
            <MaterialCommunityIcons
              name="rotate-3d"
              color="white"
              size={38}
              style={{
                position: 'absolute',
                top: 60,
                right: 30,
              }}
              onPress={() => {
                this.saveCameraSettings({
                  ...cameraSettings,
                  type:
                    cameraSettings.type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back,
                });
              }}
            />
          </>
        )}
      </Consumer>
    );

    return (
      <Consumer select={[selectors.getSession(this.state.sessionKey)]}>
        {(session: Session) => {
          switch (uiState) {
            case UiState.AskingForPermissions:
              return (
                <SafeAreaView style={styles.root}>
                  <ControlBar>
                    <View />
                  </ControlBar>
                </SafeAreaView>
              );
            case UiState.NoPermissions: {
              return (
                <SafeAreaView
                  style={[
                    styles.root,
                    { justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Text>No access to camera/Audio</Text>
                  <ControlBar>{closeButton}</ControlBar>
                </SafeAreaView>
              );
            }
            case UiState.Capturing: {
              return (
                <SafeAreaView style={styles.root}>
                  <Consumer select={[selectors.getCameraSettings()]}>
                    {(cameraSettings: CameraSettings) => (
                      <Camera
                        style={styles.fullScreen}
                        type={cameraSettings.type}
                        flashMode={cameraSettings.flashMode}
                        ref={(ref: any) => { this.camera = ref }}
                      >
                        {topButtons()}
                        <ControlBar>
                          {closeButton}
                          <TouchableOpacity
                            onPress={() => {
                              if (this.state.isVideo === true && this.state.cameraRolling === true) {
                                console.log('> stop video')
                                this.camera && this.camera.stopRecording()
                              } else if (this.state.isVideo === true && this.state.cameraRolling === false) {
                                console.log('> take video')
                                this.takeVideo()
                              } else {
                                console.log('> take photo')
                                this.takePhoto()
                              }
                            }}
                          >
                            <FontAwesome
                              name={cameraRolling ? 'spinner' : this.state.isVideo ? "video-camera" : 'camera'}
                              size={buttonLargeSize}
                              color="#FFF"
                              style={styles.centerButton}
                            />
                          </TouchableOpacity>

                          <Switch
                            onPress={() => {
                              this.saveCameraSettings({
                                ...cameraSettings,
                                type:
                                  cameraSettings.type === Camera.Constants.Type.back
                                    ? Camera.Constants.Type.front
                                    : Camera.Constants.Type.back,
                              });
                            }}


                            onValueChange={() => {
                              this.toggleVideoSwitch(cameraSettings)
                            }}
                            value={this.state.isVideo}
                          />
                        </ControlBar>
                      </Camera>
                    )}
                  </Consumer>
                </SafeAreaView>
              );
            }
            case UiState.ReviewPhoto: {
              if (preview) {
                return (
                  <SafeAreaView style={{ flex: 1 }}>
                    {
                      this.state.isVideo ?
                        <Video
                          source={{ uri: preview.uri }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={false}
                          resizeMode="cover"
                          shouldPlay
                          isLooping
                          style={styles.fullScreen}
                        />
                        :
                        <Image
                          style={[styles.fullScreen, styles.picturePreview]}
                          source={{ uri: preview.uri }}
                        />
                    }
                    <ControlBar>
                      {closeButton}
                      <FontAwesome
                        name="undo"
                        size={buttonLargeSize}
                        color="red"
                        // color="#FFF"
                        onPress={this.redoPhoto}
                        style={styles.centerButton}
                      />
                      <FontAwesome
                        name="check-circle"
                        size={buttonSize}
                        color="#FFF"
                        onPress={this.savePhoto}
                      />
                    </ControlBar>
                  </SafeAreaView>
                );
              }
            }
            default:
              return <View />;
          }
        }}
      </Consumer>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullScreen: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  picturePreview: {
    resizeMode: 'contain',
  },
  centerButton: {},
});

interface ControlBarProps {
  children: Array<React.ReactChild> | React.ReactChild;
}

const ControlBar = ({ children }: ControlBarProps) => (
  <View
    style={{
      backgroundColor: 'black',
      position: 'absolute',
      paddingBottom: 50,
      bottom: 0,
      left: 0,
      width: windowDimensions.width,
      height: Math.round(windowDimensions.height * 0.2),
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    }}
  >
    {children}
  </View>
);
