import React from 'react';
import { AsyncStorage } from 'react-native';
import { Consumer, ApplicationState, initialState } from './data';
import Router from './Router';
import { Provider } from './data';

export const applicationStateKey = 'ApplicationState';
const navigationPersistenceKey = __DEV__ ? 'NavigationStateDEV' : null;
export const SERVER_URL = 'http://ec2-18-220-203-160.us-east-2.compute.amazonaws.com:8080';

export default class Root extends React.Component {
  state = {
    initialState: null,
  };

  private onDataChange = (data: ApplicationState) => {
    AsyncStorage.setItem(applicationStateKey, JSON.stringify(data));
    return null;
  };

  private async clearData() {
    await AsyncStorage.setItem(applicationStateKey, '');
    await AsyncStorage.setItem(String(navigationPersistenceKey), '');
  }

  async componentDidMount() {
    // await this.clearData();
    const rawData = await AsyncStorage.getItem(applicationStateKey);
    this.setState({
      initialState: rawData ? JSON.parse(rawData) : initialState,
    });
  }

  render() {
    if (!this.state.initialState) {
      return null;
    }

    return (
      <Provider initialState={this.state.initialState}>
        <Consumer>{this.onDataChange}</Consumer>
        <Router persistenceKey={navigationPersistenceKey} />
      </Provider>
    );
  }
}
