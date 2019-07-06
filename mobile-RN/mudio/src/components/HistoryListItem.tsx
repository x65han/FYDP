import React from 'react';
import {
  StyleSheet, View,
  Image, Text,
  TouchableHighlight,
} from 'react-native';
import ColorUtil from '../services/ColorUtil';
import TimestampUtil from '../services/TimestampUtil';
import { Session } from '../data';
import { Video } from 'expo'

interface Props {
  sessionKey: string,
  session: Session,
  onPress: (title: string) => void;
}

export default class HistoryListItem extends React.Component<Props> {
  render() {
    const { sessionKey, session } = this.props
    if (!session) return null

    return (
      <TouchableHighlight
        style={styles.root}
        underlayColor={ColorUtil.DARK_GRAY}
        onPress={() => {
          this.props.onPress(sessionKey)
        }}
      >
        <>
          <View style={styles.left}>
            {
              session && session.isVideo ?
                <Video
                  resizeMode='cover'
                  source={{ uri: session.uri }}
                  style={styles.picture}
                />
                :
                <Image
                  resizeMode='cover'
                  source={{ uri: session.uri }}
                  style={styles.picture}
                />
            }
          </View>
          <View style={styles.right}>
            <Text>{TimestampUtil.timeAgo(sessionKey)}</Text>
            <Text>{session.isVideo}</Text>
          </View>
        </>
      </TouchableHighlight>
    );
  }
}

const paddingSize = 15
const imgSize = 50
const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  left: {
    padding: paddingSize,
  },
  right: {
    paddingLeft: 0,
    paddingRight: paddingSize,
    paddingTop: paddingSize,
    paddingBottom: paddingSize,
    borderBottomWidth: 1,
    borderColor: ColorUtil.GRAY,
    flex: 1,
  },
  picture: {
    borderRadius: 4,
    width: imgSize,
    height: imgSize,
  }
});
