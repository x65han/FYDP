import React from 'react';
import {
  Text, View, Image,
  StyleSheet, SafeAreaView,
  Dimensions, TouchableOpacity
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  mutators, Session,
  Consumer, FlashMode,
  selectors,
} from './data';
import { NavigationScreenProps } from 'react-navigation';
import { Camera, Permissions, CameraObject } from 'expo';
import TimestampUtil from './services/TimestampUtil';

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
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
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
    // Permissions.AUDIO_RECORDING
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    const uiState = (status === 'granted') ? UiState.Capturing : UiState.NoPermissions;

    this.setState({ uiState });
  }

  private takePhoto = async () => {
    if (this.camera) {
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
    if (this.camera) {
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

    try {
      await mutators.savePhoto({
        sessionKey: this.state.sessionKey,
        photoUri: photoPreview.uri,
      });
    } catch (error) {
      this.redoPhoto();
      return;
    }

    this.props.navigation.goBack();
  };

  private flipCamera(): void {
    mutators.saveCameraSettings({
      ...selectors.cameraSettings,
      type:
        selectors.cameraSettings.type === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back,
    })
  }

  private toggleFlashMode(): void {
    mutators.saveCameraSettings({
      ...selectors.cameraSettings,
      flashMode: 'off'
      // flashMode: flashModeOrder[
      //   selectors.cameraSettings.flashMode
      // ] as FlashMode,
    })
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
      <>
        <MaterialCommunityIcons
          // name={flashIcons[selectors.cameraSettings.flashMode]}
          name='torch'
          color="white"
          size={38}
          style={{
            position: 'absolute',
            top: 60,
            left: 30,
          }}
          onPress={this.toggleFlashMode}
        />
        <MaterialCommunityIcons
          name="rotate-3d"
          color="white"
          size={38}
          style={{
            position: 'absolute',
            top: 60,
            right: 30,
          }}
          onPress={this.flipCamera}
        />
      </>
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
                  <Text>No access to camera</Text>
                  <ControlBar>{closeButton}</ControlBar>
                </SafeAreaView>
              );
            }
            case UiState.Capturing: {
              return (
                <SafeAreaView style={styles.root}>
                  <Camera
                    style={styles.fullScreen}
                    type={selectors.cameraSettings.type}
                    flashMode={selectors.cameraSettings.flashMode}
                    ref={(ref: any) => {
                      this.camera = ref;
                    }}
                  >
                    {topButtons()}
                    <ControlBar>
                      {closeButton}
                      {cameraRolling ? (
                        <FontAwesome
                          name="spinner"
                          size={buttonLargeSize}
                          color="#fff"
                          style={styles.centerButton}
                        />
                      ) : (
                          <TouchableOpacity
                            onPress={() => {
                              console.log('on short press')
                              this.takePhoto()
                            }}
                            onPressIn={() => {
                              console.log('on press IN')
                            }}
                            onPressOut={() => {
                              console.log('on press OUT')
                            }}
                            onLongPress={() => {
                              console.log('on long press')
                            }}>
                            <FontAwesome
                              name="camera"
                              size={buttonLargeSize}
                              color="#FFF"
                              style={styles.centerButton}
                            />
                          </TouchableOpacity>
                        )}
                    </ControlBar>
                  </Camera>
                </SafeAreaView>
              );
            }
            case UiState.ReviewPhoto: {
              if (preview) {
                return (
                  <SafeAreaView style={{ flex: 1 }}>
                    <Image
                      style={[styles.fullScreen, styles.picturePreview]}
                      source={{ uri: preview.uri }}
                    />
                    <ControlBar>
                      {closeButton}
                      <FontAwesome
                        name="undo"
                        size={buttonLargeSize}
                        color="#FFF"
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
