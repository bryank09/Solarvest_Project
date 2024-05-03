import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    Button, Alert,
    View, TouchableOpacity,
    ScrollView,
    Switch
} from 'react-native';
import axios from 'axios';

export const retrieveAccessToken = async () => {
    let clientId, clientSecret, tenantId;
    clientId = "0e6152d6-81a4-4339-aa9a-db58a3ae57e2";
    clientSecret = "3NLkOpaD1rLKubGUcEqEPJQvMZab8MuDoWw39E81eko=";
    tenantId = "4a49838b-9576-4a6e-9bac-3704ad1e3866";
  
    const tokenUrl = `https://accounts.accesscontrol.windows.net/4a49838b-9576-4a6e-9bac-3704ad1e3866/tokens/OAuth/2`;
    const formDigestUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/contextinfo`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    const body = {
      'grant_type': `client_credentials`,
      'client_id': `${clientId}@${tenantId}`,
      'client_secret': clientSecret,
      'resource': `00000003-0000-0ff1-ce00-000000000000/solarvest.sharepoint.com@${tenantId}`
    };
    try {
      const storedTokenJSON = await AsyncStorage.getItem('sharepointToken');
      const storedToken = JSON.parse(storedTokenJSON);
      if (!storedToken) {
        throw new Error('Token not found');
      }
      const response = await axios({
        method: 'GET',
        url: 'https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web',
        headers: {
          'Authorization': `Bearer ${storedToken.accessToken}`,
          'Accept': 'application/json;odata=verbose'
        }
      });
      if (response) {
        return [storedToken.accessToken, storedToken.formDigest];
      }
    } catch (error) {
      // console.log(error.response.data);
      try {
        const response = await axios({
          method: 'POST',
          url: tokenUrl,
          headers: headers,
          data: body
        });
        if (response.data.access_token) {
          try {
            const digestResponse = await axios({
              method: 'POST',
              url: formDigestUrl,
              headers: {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${response.data.access_token}`
              },
            });
  
            if (digestResponse) {
              const tokens = {
                accessToken: response.data.access_token,
                formDigest: digestResponse.data.FormDigestValue.split(',')[0]
              };
              const jsonString = JSON.stringify(tokens);
  
              // Set the stringified object in AsyncStorage
              AsyncStorage.setItem('sharepointToken', jsonString)
                .then(() => {
                  console.log('sharepoint token Generated');
                })
                .catch((error) => {
                  console.log('Error generating sharepoint token:', error);
                });
                return [response.data.access_token, digestResponse.data.FormDigestValue.split(',')[0]];
            }
          } catch (error) {
            console.log(error);
          }
        }
      } catch (error) {
        console.log(error.response.data);
      }
    }
  };

export const Settings = ({ navigation }) => {
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [clientId, setClientId] = useState();
    const [clientSecret, setClientSecret] = useState();
    const [tenantId, setTenantId] = useState();
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    const logout = () => {
        Alert.alert("Log Out", "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel"
                },
                {
                    text: "OK",
                    onPress: async () => {
                        AsyncStorage.setItem('isLoggedIn', JSON.stringify(false));
                        Alert.alert("User Loged Out!");
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                    }
                }
            ],
        {cancelable: false})
    }

    const changeSharepointCredentials = async () => {
        const userCredentialsJSON = await AsyncStorage.getItem('userCredentials');
        const userCredentials = JSON.parse(userCredentialsJSON);
        if (userCredentials.login) {
            console.log(clientId);
            if (clientId == null || clientSecret == null || tenantId == null) {
                Alert.alert("Each input need to be filled!");
                return
            }
            const newCredential = {
                clientId: clientId,
                clientSecret: clientSecret,
                tenantId: tenantId,
            };
            const jsonString = JSON.stringify(newCredential);

            AsyncStorage.setItem('sharepointCredentials', jsonString)
                .then(() => {
                    Alert.alert("Credentials for Sharepoint have been changed Please Restart the Application")
                    console.log('sharepoint credentials changed');
                })
                .catch((error) => {
                    console.log('Error storing user credentials:', error);
                });
        } else {
            Alert.alert("It seems you are not logged in!")
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flex: 1, padding: 20, flexDirection: 'column', rowGap: 20 }}>
            {/* <View style={{ rowGap: 10 }}>
                <Text style={styles.title}>Sharepoint Feature Login</Text>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Username :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setUsername}
                        value={clientId}
                    />
                </View>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Password :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setPassword}
                        value={clientId}
                    />
                </View>
                <Button title='LogOut' onPress={logout} />
            </View> */}
            <Button title='LogOut' onPress={logout} />
            {/* <View style={{ rowGap: 10 }}>
                <Text style={styles.title}>Phone Storage Save</Text>
                <View style={{ flexDirection: 'row', columnGap: 30 }}>
                    <Text style={{ ...styles.labelText, marginBottom: 0 }}>Client-ID :</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#8829A0' }}
                        thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
                        ios_backgroundColor="#8829A0"
                        onValueChange={toggleSwitch}
                        value={isEnabled}
                    />
                </View>
            </View> */}
            {/* <View style={{ rowGap: 10 }}>
                <Text style={styles.title}>Sharepoint Credentials</Text>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Client-ID :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setClientId}
                        value={clientId}
                    />
                </View>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Client-Secret :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Client Secret"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setClientSecret}
                        value={clientSecret}
                    />
                </View>
                <View style={styles.textInputView}>
                    <Text style={styles.labelText}>Tenant-ID :</Text>
                    <TextInput
                        style={styles.inputContainer}
                        placeholder="Tenant ID"
                        placeholderTextColor="#4b4b4b"
                        onChangeText={setTenantId}
                        value={tenantId}
                    />
                </View>
                <Button title='Set Credentials' onPress={changeSharepointCredentials} />
            </View> */}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#8829A0'
    },
    textInputView: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    labelText: {
        color: '#000000',
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    inputContainer: {
        padding: 10,
        color: '#000000',
        fontSize: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        width: '100%',
    },
})