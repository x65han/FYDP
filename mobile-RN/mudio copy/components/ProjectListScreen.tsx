import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  Dimensions,
  Text, SafeAreaView
} from 'react-native';
import {
  NavigationScreenProps,
  NavigationStackScreenOptions,
  NavigationActions,
} from 'react-navigation';
import { RouteConfig, RouteParams } from './Router';
// import {  Consumer, selectors } from './data';
import ProjectListItem from './ProjectListItem';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const deviceWidth = Dimensions.get('window').width;

interface Props extends NavigationScreenProps { }

export default class ProjectListScreen extends React.Component<Props> {
  static navigationOptions = ({
    navigation,
  }: NavigationScreenProps): NavigationStackScreenOptions => ({
    title: 'Mudio',
    headerRight: (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(RouteConfig.CreateProject)
        }}
        style={styles.settingsButton}
      >
        <FontAwesome name="cog" size={26} color="black" />
      </TouchableOpacity>
    ),
  });

  private onPressItem = (title: string) => {
    this.props.navigation.navigate(RouteConfig.Project, {
      [RouteParams.ProjectName]: title,
    });
  };

  render() {
    return (
      <View style={styles.root}>
        {/* <Consumer select={[selectors.projects]}>
          {(projects: Array<Project>) =>
            projects.length ? (
              <FlatList
                data={projects}
                keyExtractor={(i: Project, index) => i.title + index}
                ItemSeparatorComponent={
                  Platform.OS === 'ios'
                    ? ({ highlighted }) => (
                      <View
                        style={[
                          styles.separator,
                          highlighted && { marginLeft: 0 },
                        ]}
                      />
                    )
                    : null
                }
                renderItem={({ item, separators }) => (
                  <ProjectListItem
                    onPress={this.onPressItem}
                    separators={separators}
                    {...item}
                  />
                )}
              />
            ) : (
                <TouchableOpacity
                  style={styles.empty}
                  onPress={() =>
                    this.props.navigation.navigate(RouteConfig.CreateProject)
                  }
                >
                  <MaterialCommunityIcons
                    name="flask-empty-outline"
                    size={deviceWidth / 2}
                    color="black"
                  />
                  <Text style={{ fontSize: 38 }}>No History</Text>
                </TouchableOpacity>
              )
          }
        </Consumer> */}

        <SafeAreaView style={styles.floatingContainer}>
          <TouchableOpacity
            onPress={() => {
              this.props.navigation.navigate(RouteConfig.CameraScreen)
            }}>
            <FontAwesome
              name="plus-circle"
              size={100}
              color="green"
            />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
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
    // shadowOffset: { width: 10, height: 10, },
    shadowColor: 'gray',
    shadowOpacity: 1.0,
    shadowRadius: 40
  },
  root: {
    flex: 1,
  },
  separator: {
    backgroundColor: '#999',
    height: 1,
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
