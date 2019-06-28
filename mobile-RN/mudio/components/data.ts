// @ts-ignore
import createState from './react-copy-write';
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
}

export const DataHelper = {
  folderPath(sessionKey: string) {
    return FileSystem.documentDirectory + encodeURIComponent(sessionKey) + '/';
  },
  createNewSession: (uri: string): Session => ({
    photo: uri
  }),
  createNewCameraSettings: () => ({
    type: Camera.Constants.Type.front,
    flashMode: FlashMode.off
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
  cameraSettings: createSelector((state: ApplicationState) => state.cameraSettings),
};

export interface Session {
  photo: string
}

export interface ApplicationState {
  history: Array<String>; // sessionKey from the latest to oldest
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
    photoUri,
  }: {
    sessionKey: string;
    photoUri: string;
  }) {
    // Create new Directory to save photos
    await FileSystem.makeDirectoryAsync(sessionKey, { intermediates: true })
    // Formulate filepath and copy image to file path
    const filePath = DataHelper.folderPath(sessionKey) + '.jpg';
    await FileSystem.copyAsync({ from: photoUri, to: filePath });

    mutate((draft: ApplicationState) => {
      draft.history.unshift(sessionKey) // push to the front of the array
      draft.dictionary[sessionKey] = DataHelper.createNewSession(photoUri)
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
