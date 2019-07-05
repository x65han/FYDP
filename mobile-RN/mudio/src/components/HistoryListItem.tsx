import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Image,
} from 'react-native';
import ColorUtil from '../services/ColorUtil';
import TimestampUtil from '../services/TimestampUtil';
import { Session } from '../data';

interface Props {
  sessionKey: string,
  dictionary: Session,
  onPress: (title: string) => void;
}

export default class HistoryListItem extends React.Component<Props> {
  render() {
    const {  sessionKey, dictionary } = this.props

    return (
      <TouchableHighlight
        style={styles.root}
        underlayColor={ColorUtil.DARK_GRAY}
        onPress={() => {
          this.props.onPress('adsf')
        }}
      >
        <>
          <View style={styles.left}>
            <Image
              source={{ uri: dictionary.photo }}
              style={styles.picture}
            />
          </View>
          <View style={styles.right}>
            <Text>{TimestampUtil.timeAgo(sessionKey)}</Text>
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
