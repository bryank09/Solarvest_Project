import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';

const Header = () => {
    return(
        <View style= {styles.header_background}>
            <Text>SolarVest</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    header_background: {
        backgroundColor: "#8829A0",
        alignItems: "center",
        padding: 20
    }
})

export default Header;