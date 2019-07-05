// @ts-ignore
import createState from './react-copy-write';
import Uploader from './services/Uploader'
import { FileSystem, Camera } from 'expo';

export interface AlignmentGuidePositions {
  center: number;
  eyes: number;
  mouth: number;
}

export enum FlashMode {
  off = 'off',
  on = 'on',
  auto = 'auto',
  torch = 'torch',
}

export interface CameraSettings {
  type: string;
  flashMode: FlashMode;
  isVideo: boolean;
}

export const DataHelper = {
  folderPath(sessionKey: string = '') {
    return FileSystem.documentDirectory + encodeURIComponent(sessionKey) + '/';
  },
  createNewSession: (uri: string, isVideo: boolean): Session => ({
    photo: uri, isVideo
  }),
  createNewCameraSettings: () => ({
    type: Camera.Constants.Type.front,
    flashMode: FlashMode.off,
    isVideo: false,
  })
};

export const { Provider, Consumer, createSelector, mutate } = createState();

export const selectors = {
  getSession(sessionKey: string): (state: ApplicationState) => Session {
    return createSelector((state: ApplicationState) => {
      return state.dictionary[sessionKey] as Session
    }
    );
  },
  getCameraSettings(): (state: ApplicationState) => CameraSettings {
    return createSelector((state: ApplicationState) => {
      return state.cameraSettings
    })
  },
  // cameraSettings: createSelector((state: ApplicationState) => state.cameraSettings),
};

export interface Session {
  photo: string,
  isVideo: boolean,
}

export interface ApplicationState {
  history: Array<string>; // sessionKey from the latest to oldest
  dictionary: any;
  cameraSettings: CameraSettings;
}

export const initialState: ApplicationState = {
  history: [],
  dictionary: {},
  cameraSettings: DataHelper.createNewCameraSettings()
};

export const mutators = {
  async savePhoto({
    sessionKey,
    uri,
    isVideo,
  }: {
    sessionKey: string;
    uri: string;
    isVideo: boolean,
  }) {
    // Create new Directory to save photos
    await FileSystem.makeDirectoryAsync(DataHelper.folderPath(sessionKey), { intermediates: true })
    // Formulate filepath and copy image to file path
    const fileName = Uploader.get_file_name_from_path(uri)
    const filePath = DataHelper.folderPath(sessionKey) + fileName;
    await FileSystem.copyAsync({ from: uri, to: filePath });

    mutate((draft: ApplicationState) => {
      draft.history.unshift(sessionKey) // push to the front of the array
      draft.dictionary[sessionKey] = DataHelper.createNewSession(uri, isVideo)
    })
  },
  saveCameraSettings({
    cameraSettings,
  }: {
    cameraSettings: CameraSettings;
  }) {
    mutate((draft: ApplicationState) => {
      draft.cameraSettings = cameraSettings
    });
  },
};
