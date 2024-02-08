import React, { useState } from 'react';
import { SafeAreaView, TextInput, Button, StyleSheet, Text, View, Image, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';

const CategoryScreen = ({ route, navigation }) => {
    const { category, amount } = route.params;
    console.log(amount);
    const [selectedImage, setSelectedImage] = useState(null);
    const [description, setDescription] = useState("")
    const openImagePicker = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('Image picker error: ', response.error);
            } else {
                let imageUri = response.uri || response.assets?.[0]?.uri;
                setSelectedImage(imageUri);
            }
        });
    };
    handleCameraLaunch = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchCamera(options, response => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.error) {
                console.log('Camera Error: ', response.error);
            } else {
                let imageUri = response.uri || response.assets?.[0]?.uri;
                setSelectedImage(imageUri);
                console.log(imageUri);
            }
        });
    };

    uploadPicture = () => {

    };

    goToCategorySection = () => {
        navigation.push(category, {})
    };

    zoomInPicture = () => {
        console.log("zoom picture");
    };

    if (amount) {
        return (
            <ScrollView contentContainerStyle={styles.categoryScreenContainer}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <FlatList
                        data={Array.from({ length: amount }, (_, index) => ({
                            id: `${index}`,
                            name: `${category} num${index + 1}`,
                        }))}
                        numColumns={2}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={goToCategorySection}>
                                <View style={styles.itemContainer}>
                                    <Text style={styles.name}>{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
                <Text style={styles.title}>List Of Pictures</Text>
                <FlatList
                    data={Array.from({ length: amount }, (_, index) => ({
                        image: require('../assets/boba2.jpg'),
                        name: `${category} num${index + 1}`,
                        description: `Description ${index + 1}`,
                    }))}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={zoomInPicture}>
                            <View style={styles.itemContainer}>
                                <Image source={item.image} style={styles.imageItem} />
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.description}>{item.description}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </ScrollView>
        );
    }
    return (
        <ScrollView contentContainerStyle={styles.categoryScreenContainer}>
            <View style={selectedImage ? styles.imageContainer : styles.uploadContainer}>
                {selectedImage ? (
                    <Image
                        source={{ uri: selectedImage }}
                        style={{ flex: 1 }}
                        resizeMode="contain"
                    />
                ) : <TouchableOpacity onPress={openImagePicker} style={{ flex: 1, alignItems: "center" }}>
                    <Icon name="image" size={50} color="#8829A0" />
                    <Text style={{ fontSize: 15, fontWeight: "bold" }}>Upload Picture</Text>
                </TouchableOpacity>
                }
            </View>
            <TextInput
                style={styles.inputContainer}
                value={description}
                onChangeText={setDescription}
                placeholder="Picture Description"
            />
            <Button title="Open Camera" onPress={handleCameraLaunch} />
            <Button title="Upload Picture" onPress={uploadPicture} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        flex: 1,
        alignItems: 'center',
        margin: 10,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    imageItem: {
        height: 250,
        width: 250
    },
    categoryScreenContainer: {
        rowGap: 15,
        padding: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8829A0'
    },
    inputContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444'
    },
    uploadContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dotted',
        borderColor: '#8829A0',
        padding: 20,
        paddingTop: 30,
        paddingBottom: 30,
    },
    imageContainer: {
        height: 400,
        width: "auto"
    },
    category_background: {
        backgroundColor: "red",
        alignItems: "center",
        padding: 20
    },
    container: {
        flex: 1,
        margin: 10,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
})

export default CategoryScreen;