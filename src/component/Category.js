import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { SafeAreaView, Dimensions, TextInput, Button, StyleSheet, Text, View, Image, SectionList, AppState, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { Camera, NoCameraDeviceError, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import PhotoEditor from "@baronha/react-native-photo-editor";
import axios from 'axios';
import RNFS from "react-native-fs";
import { btoa, atob, toByteArray } from 'react-native-quick-base64';
import { ListItem } from '@rneui/themed';
import Pinchable from 'react-native-pinchable';
import { SettingsContext } from '../../App';
import { retrieveAccessToken } from './Settings';
const { width, height } = Dimensions.get('window');
import Carousel from "react-native-reanimated-carousel";

export function useAppState() {
    const currentState = AppState.currentState
    const [appState, setAppState] = useState(currentState)

    useEffect(() => {
        function onChange(newState) {
            setAppState(newState)
        }

        const subscription = AppState.addEventListener('change', onChange)

        return () => {
            subscription.remove()
        }
    }, [])

    return appState
}

export function generateUniqueId() {
    const timestamp = new Date().getTime(); // Get current timestamp
    const randomNum = Math.floor(Math.random() * 1000); // Generate a random number between 0 and 999
    const uniqueId = `${timestamp}${randomNum}`;

    return uniqueId;
}

const stickers = [
    "https://cdn-icons-png.flaticon.com/512/5272/5272912.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272913.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272916.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272918.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272920.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272923.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272925.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272926.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272929.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272931.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272932.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272934.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272936.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272939.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272940.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272942.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272944.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272948.png",
    "https://cdn-icons-png.flaticon.com/512/5272/5272950.png"
]

export const CategoryScreen = ({ route, navigation }) => {
    const { category, amount, categoryId, project, cameraScreen } = route.params;
    const [description, setDescription] = useState("");

    const [imageSections, setImageSections] = useState([{
        id: generateUniqueId(),
        project: project,
        category: category,
        categoryId: categoryId,
        picture: '',
        description: '',
        opt: null
    }]);

    const [categoryData, setCategoryData] = useState([]);

    //delete this later for testing only
    // const [imgUri, setImgUri] = useState();

    const openImagePicker = (index) => {
        const options = {
            mediaType: 'photo',
            includeBase64: true,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('Image picker error: ', response.error);
            } else {
                // let imageUri = (response.base64 || response.assets?.[0]?.base64);
                let imageUri = response.uri || response.assets?.[0]?.uri;
                setImageSections((prevImageSections) => {
                    prevImageSections[index] = {
                        id: generateUniqueId(),
                        project: project,
                        category: category,
                        categoryId: categoryId,
                        picture: imageUri,
                        description: '',
                        opt: 'create'
                    };
                    return [...prevImageSections];
                });
            }
        });
    };

    // handleCameraLaunch = (index) => {
    //     const options = {
    //         mediaType: 'photo',
    //         includeBase64: false,
    //         maxHeight: 2000,
    //         maxWidth: 2000,
    //     };

    //     launchCamera(options, response => {
    //         if (response.didCancel) {
    //             console.log('User cancelled camera');
    //         } else if (response.error) {
    //             console.log('Camera Error: ', response.error);
    //         } else {
    //             let imageUri = response.uri || response.assets?.[0]?.uri;
    //             setImageSections((prevImageSections) => {
    //                 prevImageSections[index] = {
    //                     id: generateUniqueId(),
    //                     project: project,
    //                     category: category,
    //                     categoryId: categoryId,
    //                     picture: imageUri,
    //                     description: '',
    //                     opt: null
    //                 };
    //                 return [...prevImageSections];
    //             });
    //         }
    //     });
    // };

    goToCategorySection = (index) => {
        console.log(index);
        navigation.push(category, { category: category, amount: 0, categoryId: (index + 1), project: project })
    };

    //delete image sections
    const deleteImageSection = async (pictureId, index, imgDirectory) => {
        const updatedImageSections = [...imageSections];
        updatedImageSections.splice(index, 1);
        setImageSections(updatedImageSections);
        try {
            // Retrieve the current imageSections data from AsyncStorage
            const storedImageSections = await AsyncStorage.getItem('imageSection');
            let parsedImageSections = storedImageSections ? JSON.parse(storedImageSections) : [];
            parsedImageSections = parsedImageSections.filter(imageSection => imageSection.id !== pictureId);
            RNFS.unlink(imgDirectory)
                .then(() => {
                    console.log('FILE DELETED from local');
                })
                .catch((err) => {
                    console.log(err.message);
                });
            // Update AsyncStorage with the filtered imageSections
            await AsyncStorage.setItem('imageSection', JSON.stringify(parsedImageSections));
        } catch (error) {
            console.error('Error deleting imageSection from AsyncStorage:', error);
        }
    };

    const editImageInSection = async (index) => {
        if (!imageSections[index].picture) {
            Alert.alert("Error", "The image is missing");
            return;
        }
        const options = {
            path: imageSections[index].picture.toString(),
            sticker: stickers,
            onDone: () => {
                console.log("Done")
            }
        }
        const result = await PhotoEditor.open(options);
        if (result) {
            addImageSection(result, index);
        }
    };

    const deleteItem = async (item) => {
        const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
        const deleteUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFileByServerRelativeUrl('/sites/ProjectDevelopment/ListofImage/${item.project}/${item.category}/${item.categoryId}/${imgName}')`
        Alert.alert(
            'Confirmation',
            'Are you sure you want to delete this item?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log(''),
                    style: 'cancel'
                },
                {
                    text: 'OK',
                    onPress: async () => {
                        // **********Local Storage Delete***********
                        const storedDataJSON = await AsyncStorage.getItem('imageCategory');
                        const storedData = JSON.parse(storedDataJSON);

                        // Find the index of the item with matching id and 'delete' opt value
                        const indexToUpdate = storedData.findIndex(items => items.id === item.id && item.opt !== 'delete');

                        if (indexToUpdate !== -1) {
                            storedData[indexToUpdate].opt = 'delete';
                            console.log("storedData: " + storedData);
                            try {
                                await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                                fetchData();  // Assuming fetchData() fetches the updated data from AsyncStorage
                            } catch (error) {
                                console.log("Error updating the 'opt' key: ", error);
                            }
                        } else {
                            console.log("Item not found or already marked for deletion");
                        }

                        //**********Sharepoint Delete***********
                        try {
                            const [accessToken, formDigest] = await retrieveAccessToken();

                            const response = await axios({
                                method: 'POST',
                                url: deleteUri,
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'If-Match': '{etag or *}',
                                    'X-HTTP-Method': 'DELETE',
                                    'X-RequestDigest': formDigest,
                                },
                            });
                            if (indexToUpdate !== -1) {
                                storedData.splice(indexToUpdate, 1);  // Remove the item at the found index
                                try {
                                    await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                                    RNFS.unlink(item.picture)
                                        .then(() => {
                                            console.log('FILE DELETED from local');
                                        })
                                        // `unlink` will throw an error, if the item to unlink does not exist
                                        .catch((err) => {
                                            console.log(err.message);
                                        });
                                } catch (error) {
                                    console.log("Error updating AsyncStorage after item deletion: ", error);
                                }
                            } else {
                                console.log("Item not found or already marked for deletion");
                            }
                            console.log("File Deleted: " + response);
                        } catch (error) {
                            console.log(error);
                        }


                    }
                }
            ],
            { cancelable: true }
        );
    };

    const editItem = async (itemId, image) => {
        const options = {
            path: image.uri.toString(),
            sticker: stickers,
            onDone: () => {
                console.log("Done")
            }
        }
        const result = await PhotoEditor.open(options);
        if (result) {
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = JSON.parse(storedDataJSON);
            let itemExist = false;

            for (let i = 0; i < storedData.length; i++) {
                // If object with desired name is found
                if (storedData[i].id === itemId) {
                    // storedData[i].picture = result;
                    const newItem = {
                        id: generateUniqueId(),
                        project: storedData[i].project,
                        category: storedData[i].category,
                        categoryId: storedData[i].categoryId,
                        picture: result,
                        description: storedData[i].description,
                        opt: 'create'
                    };

                    //*********Local Storage upload edited picture ********/
                    storedData.splice(i + 1, 0, newItem);
                    try {
                        //when Item exist in AsyncStorage
                        await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                        fetchData();
                    } catch (error) {
                        console.log("Error in storing the edited data: ", error);
                    }
                    //*********Sharepoint Upload Edited Picture ********/
                    const folderUri = `${newItem.project}/${newItem.category}/${newItem.categoryId}`;
                    const imgName = `${newItem.id}_${newItem.project}_${newItem.category}_${newItem.categoryId}_${newItem.description}.jpg`;
                    try {
                        await uploadImageSharepoint(newItem.picture, imgName, folderUri, newItem.id);
                    } catch (error) {
                        console.log("Error Uploading Edited Img Sharepoint" + error)
                    }
                    itemExist = true;
                    break;
                }
            }
        }
    };

    const formatData = (storageData, category) => {
        const filteredData = storageData.filter(item =>
            item.category === category && item.project === project && item.opt != 'delete'
        );

        const sections = filteredData.reduce((acc, item) => {
            const categoryKey = `${item.category} ${item.category_id ? item.category_id : item.categoryId}`;
            if (!acc[categoryKey]) {
                acc[categoryKey] = [];
            }
            acc[categoryKey].push({
                ...item
            });
            return acc;
        }, {});
        const formattedData = Object.entries(sections).map(([title, data]) => ({
            title,
            data: data.map((item, index) => {
                const nextIndex = index < data.length - 1 ? storageData.findIndex(elem => elem.id === data[index + 1].id) : null;
                const prevIndex = index !== 0 ? storageData.findIndex(elem => elem.id === data[index - 1].id) : null;
                const currentIndex = storageData.findIndex(elem => elem.id === item.id);
                return {
                    ...item,
                    nextIndex,
                    prevIndex,
                    currentIndex
                };
            })
        }));

        return formattedData;
    };

    const fetchData = async () => {
        try {
            // ************Fetch Local Storage Data***********
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            setCategoryData(formatData(storedData, category));

            const imgSectionJSON = await AsyncStorage.getItem('imageSection');
            const imgSection = imgSectionJSON ? JSON.parse(imgSectionJSON) : [];
            if (imgSection.length) {
                setImageSections(imgSection);
            }
            // ************Fetch Sharepoint Data***********
            const sharepointDataJSON = await AsyncStorage.getItem('imageCategory');
            const sharepointData = sharepointDataJSON ? JSON.parse(sharepointDataJSON) : [];

        } catch (error) {
            // console.log(error.response.data);
            console.log("Error in fetching data: " + error);
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            // await AsyncStorage.removeItem('imageCategory');
            fetchData();
        }, [])
    );

    const checkFolderExist = async (folderUri) => {
        const checkUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${folderUri}')`
        const uploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
        let folderExist = true;
        try {
            const [accessToken, formDigest] = await retrieveAccessToken();

            const response = await axios.get(checkUri, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json;odata=verbose',
                },
            });

            console.log('File Exist: ' + response.data.d.Exists);
            return response.data.d.Exists;
        } catch (error) {
            // *********Create sharepoint folder path***********
            if (error.response.data.error.code == "-2147024894, System.IO.FileNotFoundException") {
                let parentFolder = project;
                const [accessToken, formDigest] = await retrieveAccessToken();

                for (let path of folderUri.split('/').splice(1)) {
                    try {
                        const response = await axios({
                            method: 'POST',
                            url: uploadUri,
                            data: {
                                "__metadata": {
                                    "type": "SP.Folder"
                                },
                                "ServerRelativeUrl": `ListofImage/${parentFolder}/${path}`
                            },
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Accept': 'application/json;odata=verbose',
                                'Content-Type': 'application/json;odata=verbose',
                                'X-RequestDigest': formDigest,
                            },
                        });
                        parentFolder += '/' + path;
                        console.log("Folder created: " + response.data.d.Exists);
                        folderExist = response.data.d.Exists;
                    } catch (error) {
                        console.log(error.response.data);
                        return false;
                    }
                }
            }
        }
        return folderExist;
    }

    const loadImageBase64 = async (capturedImageURI) => {
        try {
            const base64Data = await RNFS.readFile(capturedImageURI, 'base64');
            return base64Data;
        } catch (error) {
            console.error('Error converting image to base64:', error);
        }
    };

    const uploadImageSharepoint = async (imgUri, imgName, folderUri, imgId) => {
        // const imgName = "testPicture.jpg";
        // const base64Image = await loadImageBase64(imageSections[0].picture);
        // const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/Shared Documents/Images\')/Files/add(url=\'${imgName}\',overwrite=true)`;
        const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${folderUri}\')/Files/add(url=\'${imgName}\',overwrite=true)`;
        const base64Image = await loadImageBase64(imgUri);
        const [accessToken, formDigest] = await retrieveAccessToken();
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'X-RequestDigest': formDigest,
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'image/jpg'
        }

        const arrayBuffer = toByteArray(base64Image);
        try {
            const response = await axios({
                method: 'POST',
                url: fileUploadUrl,
                data: arrayBuffer,
                headers: headers,
            });
            if (response.data.d.Exists) {
                try {
                    const storedDataJSON = await AsyncStorage.getItem('imageCategory');
                    const storedData = JSON.parse(storedDataJSON);
                    const indexToUpdate = storedData.findIndex(item => item.id === imgId && item.opt === 'create');

                    if (indexToUpdate !== -1) {
                        storedData[indexToUpdate].opt = '';
                        console.log("storedData: " + storedData);
                        try {
                            await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                        } catch (error) {
                            console.log("Error updating the 'opt' key: ", error);
                        }
                    } else {
                        console.log("Item not found to update the operation");
                    }
                } catch (error) {
                    console.log("error in updating the operation of he object")
                }
                console.log("Image Uploaded to Sharepoint: " + imgName);
                return true;
            }
            console.log(response.data.d.Exists);
        } catch (error) {
            console.log(error.response.data);
        }
    };

    const uploadPicture = async () => {
        if (imageSections.some(item => item.picture === "")) {
            Alert.alert("Error", "There are some missing image");
            return;
        }
        try {
            const updatedImageSections = imageSections.map(item => {
                if (item.category !== category) {
                    return {
                        ...item,
                        category: category
                    };
                }
                return item;
            });
            //********local storage upload*******
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

            storedData.push(...updatedImageSections);
            await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
            await AsyncStorage.removeItem('imageSection');
            navigation.goBack();

            // ***********sharepoint upload***********
            const folderUri = `${project}/${category}/${categoryId}`;
            const folderExist = await checkFolderExist(folderUri);

            if (folderExist) {
                updatedImageSections.forEach(async (item, idx) => {
                    try {
                        const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
                        await uploadImageSharepoint(item.picture, imgName, folderUri, item.id);

                        // await sendDataToSharepoint(item.picture, parseInt(item.id), item.category.toString(), parseInt(item.categoryId), item.description.toString());
                    } catch (error) {
                        console.error('Error sending data to SharePoint:', error);
                    }
                });
            }

        } catch (error) {
            console.error('Error appending data to AsyncStorage:', error);
        }
    };

    const [expandedSections, setExpandedSections] = useState({});
    const toggleSection = (sectionTitle) => {
        setExpandedSections({
            ...expandedSections,
            [sectionTitle]: !expandedSections[sectionTitle],
        });
    };
    const swapPictureItems = async (currentIndex, newIndex) => {
        try {
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            const removedItem = storedData.splice(currentIndex, 1)[0];
            storedData.splice(newIndex, 0, removedItem);
    
            await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
    
            setCategoryData(formatData(storedData, category));
        } catch (error) {
            console.error('Error swapping picture items:', error);
        }
    };

    if (amount) {
        return (
            <ScrollView contentContainerStyle={styles.categoryScreenContainer}>
                {/* <Button title="Add Project" onPress={addProject} /> */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <FlatList
                        contentContainerStyle={{ flex: 1 }}
                        data={Array.from({ length: amount }, (_, index) => ({
                            id: `${index}`,
                            name: `${category} - No ${index + 1}`,
                        }))}
                        numColumns={2}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity onPress={() => goToCategorySection(index)}>
                                <View style={styles.itemContainer}>
                                    <Text style={{ color: 'black' }}>{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
                <Text style={styles.title}>List Of Pictures</Text>
                {categoryData.map((category) => (
                    <ListItem.Accordion
                        key={category.title}
                        content={
                            <>
                                <Text style={styles.sectionHeader}>{category.title}</Text>
                            </>
                        }
                        isExpanded={expandedSections[category.title] || false}
                        onPress={() => toggleSection(category.title)}
                        containerStyle={{ backgroundColor: 'transparent' }}
                    >
                        {category.data.map((item, index) => (
                            <View key={item.id} >
                                <View style={styles.displayPictureContainer}>
                                    <View style={{ flex: 1, flexDirection: 'row', columnGap: 15, marginBottom: 5, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                        {index > 0 && (
                                            <TouchableOpacity onPress={() => swapPictureItems(item.currentIndex, item.prevIndex)}>
                                                <FontAwesome5 name='arrow-up' size={17} color='black' />
                                            </TouchableOpacity>
                                        )}
                                        {index < category.data.length - 1 && (
                                            <TouchableOpacity onPress={() => swapPictureItems(item.currentIndex, item.nextIndex)}>
                                                <FontAwesome5 name='arrow-down' size={17} color='black' />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => deleteItem(item)}>
                                            <FontAwesome5 name='trash' size={17} color='black' />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => editItem(item.id, { uri: item.picture })}>
                                            <FontAwesome5 name='edit' size={17} color='black' />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Pinchable>
                                            <Image source={item.picture == "null" || item.picture != null ? { uri: item.picture } : require('../assets/images.png')} style={styles.imageItem} />
                                        </Pinchable>
                                        <Text style={styles.name}>{item.category} - No. {item.categoryId}</Text>
                                        <Text style={styles.description}>Description: {item.description || "no description"}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ListItem.Accordion>
                ))}
            </ScrollView>
        );
    }

    const addImageSection = (imgUri, index) => {
        const newSection = {
            id: generateUniqueId(),
            project: project,
            category: category,
            categoryId: categoryId,
            picture: imgUri,
            description: '',
            opt: 'create'
        };

        index == null ? setImageSections([...imageSections, newSection])
            :
            setImageSections(prevSections => {
                const updatedSections = [...prevSections];
                updatedSections.splice(index + 1, 0, newSection);
                return updatedSections;
            });
    };

    const isFocused = useIsFocused();
    const [isActive, setIsActive] = useState(false);
    useEffect(() => {
        setIsActive(isFocused && !amount);
    });

    const navigateCamera = () => {
        navigation.navigate('Camera', { category: category, amount: 0, categoryId: categoryId, project: project, tempImageSection: imageSections })
    }

    const swapItems = (array, indexA, indexB) => {
        const newArray = [...array];
        [newArray[indexA], newArray[indexB]] = [newArray[indexB], newArray[indexA]];
        return newArray;
    };
    const handleSwapItems = async (indexA, indexB) => {
        const updatedSections = swapItems(imageSections, indexA, indexB); // Assuming you have the swapItems function as mentioned in the previous answer

        // Update the state
        setImageSections(updatedSections);

        // Save to AsyncStorage
        try {
            await AsyncStorage.setItem('imageSection', JSON.stringify(updatedSections));
            console.log('Image sections updated and saved to AsyncStorage');
        } catch (error) {
            console.error('Error saving updated image sections to AsyncStorage:', error);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, }}>
            <View style={{ alignItems: 'center' }}>
                <TouchableOpacity style={styles.cameraButton} onPress={navigateCamera}>
                    <FontAwesome5 name='camera' size={35} color='black' />
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>Pictures</Text>
            <FlatList
                data={imageSections}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.imageSectionContainer}
                renderItem={({ item: section, index }) => (
                    <View style={styles.uploadPictureContainer}>
                        <View style={{ flex: 1, flexDirection: 'row', columnGap: 15, justifyContent: 'flex-end' }}>
                            {index > 0 && (
                                <TouchableOpacity onPress={() => handleSwapItems(index, index - 1)}>
                                    <FontAwesome5 name='arrow-up' size={17} color='black' />
                                </TouchableOpacity>
                            )}
                            {index < imageSections.length - 1 && (
                                <TouchableOpacity onPress={() => handleSwapItems(index, index + 1)}>
                                    <FontAwesome5 name='arrow-down' size={17} color='black' />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => deleteImageSection(section.id, index, section.picture)}>
                                <FontAwesome5 name='trash' size={17} color='black' />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => editImageInSection(index)}>
                                <FontAwesome5 name='edit' size={17} color='black' />
                            </TouchableOpacity>
                        </View>
                        <View style={section.picture ? styles.imageContainer : styles.uploadContainer}>
                            {section.picture ? (
                                <Image
                                    source={{ uri: section.picture }}
                                    style={{ flex: 1 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <TouchableOpacity onPress={() => openImagePicker(index)} style={{ flex: 1, alignItems: 'center' }}>
                                    <Icon name="image" size={50} color="#8829A0" />
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}>Upload Picture</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput
                            onBlur={() => setIsActive(true)}
                            style={styles.inputContainer}
                            value={section.description}
                            onChangeText={(text) => {
                                const newSections = [...imageSections];
                                newSections[index].description = text;
                                setImageSections(newSections);
                            }}
                            placeholder="Picture Description"
                        />
                        {/* <Button title="Open Camera" onPress={() => handleCameraLaunch(index)} /> */}
                    </View>
                )}
                ListFooterComponent={() => (
                    <>
                        <View style={{ alignItems: 'center', marginVertical: 5 }}>
                            <View style={{ borderBottomWidth: 1, borderColor: 'black', width: '100%', marginBottom: 5 }} />
                            <TouchableOpacity onPress={() => addImageSection('')}>
                                <Icon name="plus-circle" size={30} color="#8829A0" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            />
            <View>
                <Button title="Upload Picture" onPress={uploadPicture} />
            </View>
        </View>
    );
};

export const CameraScreen = ({ route, navigation }) => {
    const { category, amount, categoryId, project, tempImageSection } = route.params;
    const [imageSections, setImageSections] = useState(tempImageSection.length == 1 && tempImageSection[0].picture == "" ? [] : tempImageSection);
    const { hasPermission, requestPermission } = useCameraPermission();
    requestPermission();
    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }), [hasPermission];

    const device = useCameraDevice('back');
    const camera = useRef(null);
    const takePhotoOptions = {
        flash: 'off'
    };

    const onError = useCallback((error) => {
        console.error(error)
    }, []);

    const takePhoto = async () => {
        try {
            const photo = await camera.current.takePhoto(takePhotoOptions);
            const imgUri = await CameraRoll.saveAsset(`file://${photo.path}`, {
                type: 'photo',
            });
            const photoData = await RNFS.readFile(imgUri.node.image.uri, 'base64');
            const fileName = `${new Date().getTime()}.jpg`;
            const imgPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            await RNFS.writeFile(imgPath, photoData, 'base64');

            setImageSections((prevImageSections) => {
                const newImageSection = {
                    id: generateUniqueId(),
                    project: project,
                    category: category,
                    categoryId: categoryId,
                    picture: `file://${imgPath}`,
                    description: '',
                    opt: 'create'
                };

                const updatedImageSections = [...prevImageSections, newImageSection];

                // Set AsyncStorage after updating state
                AsyncStorage.setItem('imageSection', JSON.stringify(updatedImageSections))
                    .catch(error => {
                        console.error('Error setting imageSection in AsyncStorage:', error);
                    });
                return updatedImageSections;
            });
        } catch (error) {
            console.error('Error capturing photo:', error);
        }
    };
    if (device != null) {
        return (
            <View style={styles.cameraContainer}>
                <Camera
                    ref={camera}
                    onError={onError}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    photo={true}
                />
                <View style={{ position: 'absolute', bottom: 200, alignself: 'center' }}>
                    <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                        <FontAwesome5 name='camera' size={35} color='black' />
                    </TouchableOpacity>
                </View>
                <View style={{ position: 'absolute', bottom: 0, width: '100%', height: height * 0.2 }}>
                    <Carousel
                        loop
                        width={width}
                        height={height * 0.2}
                        sliderWidth={width}
                        itemWidth={width * 0.3}
                        data={imageSections.filter(item => item.picture !== "")}
                        inactiveSlideScale={1}
                        scrollAnimationDuration={1000}
                        onSnapToItem={(index) => console.log('current index:', index)}
                        renderItem={({ item }) => (
                            console.log(item),
                            <View style={{ flex: 1, borderWidth: 1, justifyContent: 'center' }}>
                                <Image
                                    source={{ uri: item.picture }}
                                    style={{ flex: 1 }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    />
                </View>
                {/* <View style={{ position: 'absolute', bottom: 0, width: '100%', height: height * 0.2 }}>
                    <Carousel
                        loop
                        width={width}
                        height={height * 0.2}
                        autoPlay={true}
                        data={imageSections}
                        scrollAnimationDuration={1000}
                        onSnapToItem={(index) => console.log('current index:', index)}
                        renderItem={({ item }) => (
                            <View style={{ flex: 1, borderWidth: 1, justifyContent: 'center' }}>
                                <Image
                                    source={{ uri: item.picture }}
                                    style={{ flex: 1 }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    />
                </View> */}
            </View>
        );
    }
    return <NoCameraDeviceError />;
}

const styles = StyleSheet.create({
    itemContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        margin: 7,
        padding: 15,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 8,
        backgroundColor: 'white',
        maxWidth: '70%', // Constrained max width for each item
        alignItems: 'center', // Center align items
    },
    displayPictureContainer: {
        flex: 1,
        margin: 5,
        padding: 15,
        borderWidth: 2,
        borderColor: 'black',
        borderRadius: 8,
    },
    imageItem: {
        height: 250,
        width: 250
    },
    categoryScreenContainer: {
        rowGap: 10,
        padding: 20
    },
    cameraContainer: {
        flex: 1,
        minHeight: height * 0.3,
        width: '100%',
        rowGap: 5,
        alignItems: 'center'
        // backgroundColor: 'black'
    },
    camera: {
        height: height * 0.3,
        width: '92%',
        alignSelf: 'center',
    },
    cameraButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 55,
        height: 55,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#8829A0',
        backgroundColor: 'white',
    },
    imageSectionContainer: {
        flexGrow: 1,
        rowGap: 10,
    },
    uploadPictureContainer: {
        rowGap: 15,
        padding: 10,
        borderWidth: 2,
        borderColor: 'black',
        borderRadius: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#8829A0'
    },
    sectionHeader: {
        backgroundColor: 'black', // Your desired background color
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        padding: 5,
        borderRadius: 15,
        width: '25%',
        textAlign: 'center'
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
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
        height: 300,
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
    }
})

export default CategoryScreen;