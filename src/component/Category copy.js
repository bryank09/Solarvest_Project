import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, Dimensions, TextInput, Button, StyleSheet, Text, View, Image, SectionList, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
const { height } = Dimensions.get('window');

function generateUniqueId() {
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

const CategoryScreen = ({ route, navigation }) => {
    const { category, amount, categoryId, project } = route.params;
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
                        opt: null
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

    zoomInPicture = () => {
        console.log("zoom picture");
    };

    //delete image sections
    const deleteImageSection = (index) => {
        const updatedImageSections = [...imageSections];
        updatedImageSections.splice(index, 1);
        setImageSections(updatedImageSections);
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
        console.log(imgName);
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
                        //**********Sharepoint Delete***********
                        try {
                            const response = await axios({
                                method: 'POST',
                                url: deleteUri,
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'If-Match': '{etag or *}',
                                    'X-HTTP-Method': 'DELETE',
                                    'X-RequestDigest': formDigest,
                                },
                            });

                            console.log("File Deleted: " + response);
                        } catch (error) {
                            console.log(error.response.data);
                        }

                        // **********Local Storage Delete***********
                        const storedDataJSON = await AsyncStorage.getItem('imageCategory');
                        const storedData = JSON.parse(storedDataJSON);
                        const filterData = storedData.filter(items => items.id !== item.id);
                        if (storedData.length > filterData.length) {
                            try {
                                await AsyncStorage.setItem('imageCategory', JSON.stringify(filterData));
                                fetchData();
                            } catch (error) {
                                console.log("Error in deleting the picture: ", error);
                            }
                        } else {
                            console.log('Item not found');
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
                        opt: 'edit'
                    };
                    //*********Sharepoint Upload Edited Picture ********/
                    const folderUri = `${newItem.project}/${newItem.category}/${newItem.categoryId}`;
                    const imgName = `${newItem.id}_${newItem.project}_${newItem.category}_${newItem.categoryId}_${newItem.description}.jpg`;
                    try {
                        await uploadImageSharepoint(newItem.picture, imgName, folderUri);
                    } catch (error) {
                        console.log("Error Uploading Edited Img Sharepoint" + error)
                    }
                    //*********Local Storage upload edited picture ********/
                    storedData.splice(i + 1, 0, newItem);
                    itemExist = true;
                    break;
                }
            }

            if (itemExist) {
                try {
                    //when Item exist in AsyncStorage
                    await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                    fetchData();
                } catch (error) {
                    console.log("Error in storing the edited data: ", error);
                }
            }
        }
    };

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const response = await Promise.race([
    //             fetch('https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/lists/getbytitle(\'Images\')/items', {
    //                 method: 'GET',
    //                 headers: {
    //                     Accept: 'application/json;odata=verbose',
    //                     'Content-Type': 'application/json;odata=verbose',
    //                     Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlhSdmtvOFA3QTNVYVdTblU3Yk05blQwTWpoQSIsImtpZCI6IlhSdmtvOFA3QTNVYVdTblU3Yk05blQwTWpoQSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvc29sYXJ2ZXN0LnNoYXJlcG9pbnQuY29tQDRhNDk4MzhiLTk1NzYtNGE2ZS05YmFjLTM3MDRhZDFlMzg2NiIsImlzcyI6IjAwMDAwMDAxLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMEA0YTQ5ODM4Yi05NTc2LTRhNmUtOWJhYy0zNzA0YWQxZTM4NjYiLCJpYXQiOjE3MTAxMjM5MTQsIm5iZiI6MTcxMDEyMzkxNCwiZXhwIjoxNzEwMjEwNjE0LCJpZGVudGl0eXByb3ZpZGVyIjoiMDAwMDAwMDEtMDAwMC0wMDAwLWMwMDAtMDAwMDAwMDAwMDAwQDRhNDk4MzhiLTk1NzYtNGE2ZS05YmFjLTM3MDRhZDFlMzg2NiIsIm5hbWVpZCI6IjBlNjE1MmQ2LTgxYTQtNDMzOS1hYTlhLWRiNThhM2FlNTdlMkA0YTQ5ODM4Yi05NTc2LTRhNmUtOWJhYy0zNzA0YWQxZTM4NjYiLCJvaWQiOiI5YzRiZDkxZS0zZDUxLTQ5NDUtYWU5NS0wOGRmYjJkZWNhMWYiLCJzdWIiOiI5YzRiZDkxZS0zZDUxLTQ5NDUtYWU5NS0wOGRmYjJkZWNhMWYiLCJ0cnVzdGVkZm9yZGVsZWdhdGlvbiI6ImZhbHNlIn0.NpDGwWO8cicMJVl_H5JMSmhpV5DOSGTgJZjLw150ns3pRybpEy4gaLh4Q0ED1GWXz3vB0OvdY3MtLYvL_qzzetMO2NLnCMfIpOkZAafS9Yfx-5UOjBENh3f3RrdlSb71lt5-0XsmYTG3i5tqtjEsyPA-rcRP7oPYrOTa1QPSKURxYFEN4RUHd3TZCaythRPO5j7zc77PIkGjWReE2rUiw0aZMpLKnQxRLJusACSI60P2Xbq6ggeIybPGFQ-uMl2fEsEZsEoPV9KtC65miGBOV8b9SmtoYvUvfh9zvszIampl9oofAXdvpLSH2jwxdtUYsS1PQZlQQlRJ4rR5KC1_yw`,
    //                 },
    //             }),
    //             new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000)) // Timeout after 5 seconds
    //         ]);

    //             if (response.ok) {
    //                 //send data here

    //                 const responseBody = await response.json();
    //                 const results = responseBody.d.results;
    //                 const sharepointData = results.map(result => ({
    //                     category: result.category,
    //                     category_id: result.category_id,
    //                     description: result.description,
    //                     picture: result.image,
    //                     // Add other properties as needed
    //                 }));
    //                 setCategoryData(formatData(sharepointData, category));
    //                 // results.forEach((result, index) => {
    //                 //     console.log(`Object ${index + 1}:`, result.category);
    //                 // });
    //                 console.log("data fetched from Sharepoint successfuly");
    //             } else {
    //                 console.error('Error fetching data from SharePoint:', response.status);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching data from SharePoint:', error);

    //             const storedDataJSON = await AsyncStorage.getItem('imageCategory');
    //             const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

    //             // console.log(storedData);
    //             setCategoryData(formatData(storedData, category));

    //             console.log('Data fetched from AsyncStorage');
    //         }
    //     }

    //     if(amount)
    //         fetchData();
    // }, []);

    const formatData = (data, category) => {
        const filteredData = data.filter(item =>
            item.category === category && item.project === project
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

        return Object.entries(sections).map(([title, data]) => ({
            title,
            data,
        }));
    };

    const fetchData = async () => {
        try {
            // ************Fetch Local Storage Data***********
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

            // console.log(storedData.filter(item =>
            //     item.category === category && item.project === project));
            setCategoryData(formatData(storedData, category));

            // ************Fetch Sharepoint Data***********
            const fetchUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/testing')?$expand=Folders`;
            const response = await axios({
                method: 'GET',
                url: fetchUri,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json; odata=verbose',
                },
            });
            const responseData = response.data.d.Folders.results;
            let fileNames = [];
            responseData.forEach(async (folder) => {
                const folderName = folder.Name;
                const foldersUri = folder.Folders.__deferred.uri;

                try {
                    // Fetch the CategoryID
                    const foldersResponse = await axios({
                        method: 'GET',
                        url: foldersUri,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': "application/json;odata=verbose",
                        },
                    });

                    if (foldersResponse.status === 200 && foldersResponse.data.d.results) {
                        const subfolder = foldersResponse.data.d.results;
                        // console.log(`Subfolders inside ${folderName}:`, subfolder);
                        // Fetch files inside the Category ID
                        for (const subfiles of subfolder) {
                            const subfilesName = subfiles.Name;
                            const filesUri = subfiles.Files.__deferred.uri;
                            try {
                                // fetch cateogry ID
                                const filesResponse = await axios({
                                    method: 'GET',
                                    url: filesUri,
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Accept': "application/json;odata=verbose",
                                    },
                                });

                                if (filesResponse.status === 200 && filesResponse.data.d.results) {

                                    if (filesResponse.data.d.results.length !== 0) {
                                        const fileNamesInSubfolder = filesResponse.data.d.results.map(file => file.Name);

                                        fileNames.push(...fileNamesInSubfolder);
                                    }
                                    // console.log(`Files inside ${folderName} No ${subfilesName}:`, files);
                                } else {
                                    console.log(`No files found inside ${subfilesName}`);
                                }
                            } catch (error) {
                                console.error(`Error fetching files for ${subfilesName}:`, error);
                            }
                        }
                    } else {
                        console.log(`No subfolders found inside ${folderName}`);
                    }
                } catch (error) {
                    console.error(`Error fetching data for ${folderName}:`, error);
                }
            });


        } catch (error) {
            // console.log(error.response.data);
            console.log("Error in fetching data: " + error);
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const sendDataToSharepoint = async (formatedImg, item_id, category, categoryId, description) => {
        try {
            const newItem = {
                "__metadata": {
                    "type": "SP.Data.ImagesListItem"
                },
                "Title": "SolarVest",
                "item_id": item_id,
                "category": category,
                "category_id": categoryId,
                "description": description
            }

            const response = await fetch('https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/lists/getbytitle(\'Images\')/items', {
                method: 'POST',
                headers: {
                    Accept: 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlhSdmtvOFA3QTNVYVdTblU3Yk05blQwTWpoQSIsImtpZCI6IlhSdmtvOFA3QTNVYVdTblU3Yk05blQwTWpoQSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvc29sYXJ2ZXN0LnNoYXJlcG9pbnQuY29tQDRhNDk4MzhiLTk1NzYtNGE2ZS05YmFjLTM3MDRhZDFlMzg2NiIsImlzcyI6IjAwMDAwMDAxLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMEA0YTQ5ODM4Yi05NTc2LTRhNmUtOWJhYy0zNzA0YWQxZTM4NjYiLCJpYXQiOjE3MTAxMjM5MTQsIm5iZiI6MTcxMDEyMzkxNCwiZXhwIjoxNzEwMjEwNjE0LCJpZGVudGl0eXByb3ZpZGVyIjoiMDAwMDAwMDEtMDAwMC0wMDAwLWMwMDAtMDAwMDAwMDAwMDAwQDRhNDk4MzhiLTk1NzYtNGE2ZS05YmFjLTM3MDRhZDFlMzg2NiIsIm5hbWVpZCI6IjBlNjE1MmQ2LTgxYTQtNDMzOS1hYTlhLWRiNThhM2FlNTdlMkA0YTQ5ODM4Yi05NTc2LTRhNmUtOWJhYy0zNzA0YWQxZTM4NjYiLCJvaWQiOiI5YzRiZDkxZS0zZDUxLTQ5NDUtYWU5NS0wOGRmYjJkZWNhMWYiLCJzdWIiOiI5YzRiZDkxZS0zZDUxLTQ5NDUtYWU5NS0wOGRmYjJkZWNhMWYiLCJ0cnVzdGVkZm9yZGVsZWdhdGlvbiI6ImZhbHNlIn0.NpDGwWO8cicMJVl_H5JMSmhpV5DOSGTgJZjLw150ns3pRybpEy4gaLh4Q0ED1GWXz3vB0OvdY3MtLYvL_qzzetMO2NLnCMfIpOkZAafS9Yfx-5UOjBENh3f3RrdlSb71lt5-0XsmYTG3i5tqtjEsyPA-rcRP7oPYrOTa1QPSKURxYFEN4RUHd3TZCaythRPO5j7zc77PIkGjWReE2rUiw0aZMpLKnQxRLJusACSI60P2Xbq6ggeIybPGFQ-uMl2fEsEZsEoPV9KtC65miGBOV8b9SmtoYvUvfh9zvszIampl9oofAXdvpLSH2jwxdtUYsS1PQZlQQlRJ4rR5KC1_yw`,
                },
                body: JSON.stringify(newItem),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Created item:', data.d);
            } else {
                console.log("error in creating item: ", response.statusText);
            }
        } catch (error) {
            console.error('error sending data to sharepoint:', error);
        }
    }
    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InEtMjNmYWxldlpoaEQzaG05Q1Fia1A1TVF5VSIsImtpZCI6InEtMjNmYWxldlpoaEQzaG05Q1Fia1A1TVF5VSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvc29sYXJ2ZXN0LnNoYXJlcG9pbnQuY29tQDRhNDk4MzhiLTk1NzYtNGE2ZS05YmFjLTM3MDRhZDFlMzg2NiIsImlzcyI6IjAwMDAwMDAxLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMEA0YTQ5ODM4Yi05NTc2LTRhNmUtOWJhYy0zNzA0YWQxZTM4NjYiLCJpYXQiOjE3MTI4OTY0NTQsIm5iZiI6MTcxMjg5NjQ1NCwiZXhwIjoxNzEyOTI1NTU0LCJhY3RvciI6IjBlNjE1MmQ2LTgxYTQtNDMzOS1hYTlhLWRiNThhM2FlNTdlMkA0YTQ5ODM4Yi05NTc2LTRhNmUtOWJhYy0zNzA0YWQxZTM4NjYiLCJpZGVudGl0eXByb3ZpZGVyIjoidXJuOmZlZGVyYXRpb246bWljcm9zb2Z0b25saW5lIiwibmFtZWlkIjoiMTAwMzIwMDJFOTg4MUU3OCJ9.CHSUvHa9pV1WFaJrvW-X3sGChtSWKGw8HvKT9TaTeoNHhwowhQQAqT-U7xe3m2r4V84qqdgiVBtvyN1KSa6FhHIGV4G4ZnJHSeIB9EHFuhsyZXBcjzdICTjiqkOgWSWbkG_I7btFGVKGYMChoWLfPOjW0eFaJm4JWoVgA-HwE4EPzqQUI0qTJo3_i3WGEXvRYTRGQNIJQNd0FC4wFpkBBtq7ZqI9u7YYFDwmdsEksigpwokjbXhqC_eYKOlueOezVKQ25o9USnLCDL4M01JwoFXTux5490Djz6shAmi9UkDZY7ybMECQy3dEvFqQzffRSbWOgPzQP9u4k9dR_mMXJA";
    const formDigest = "0x4EB2AE6A2B837A0496848E923A584992FC3CFCFDD08325020C04F9F4F6086599DF54E6136CD5AE4A99BEA252EBCCAB274A693752513F91D940C30B262AC58407";

    const checkFolderExist = async (folderUri) => {
        const checkUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${folderUri}')`
        const uploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
        let folderExist = true;
        try {
            const response = await axios.get(checkUri, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json;odata=verbose',
                },
            });

            console.log('File Exist: ' + response.data.d.Exists);
            return response.data.d.Exists;
        } catch (error) {
            // *********Create sharepoint folder path***********
            if (error.response.data.error.code == "-2147024894, System.IO.FileNotFoundException") {
                let parentFolder = project;
                console.log(folderUri.split('/'));
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
                                'Authorization': `Bearer ${token}`,
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

    const uploadImageSharepoint = async (imgUri, imgName, folderUri) => {
        // const imgName = "testPicture.jpg";
        // const base64Image = await loadImageBase64(imageSections[0].picture);
        // const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/Shared Documents/Images\')/Files/add(url=\'${imgName}\',overwrite=true)`;
        const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${folderUri}\')/Files/add(url=\'${imgName}\',overwrite=true)`;
        const base64Image = await loadImageBase64(imgUri);
        const headers = {
            'Authorization': `Bearer ${token}`,
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
            // ***********sharepoint upload***********
            const folderUri = `${project}/${category}/${categoryId}`;
            const folderExist = await checkFolderExist(folderUri);

            if (folderExist) {
                imageSections.forEach(async (item, idx) => {
                    try {
                        const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
                        await uploadImageSharepoint(item.picture, imgName, folderUri, idx);

                        // await sendDataToSharepoint(item.picture, parseInt(item.id), item.category.toString(), parseInt(item.categoryId), item.description.toString());
                    } catch (error) {
                        console.error('Error sending data to SharePoint:', error);
                    }
                });
            }
            //********local storage upload*******
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

            storedData.push(...imageSections);
            await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
            navigation.goBack();
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
    if (amount) {
        return (
            <ScrollView contentContainerStyle={styles.categoryScreenContainer}>
                {/* <Button title="Add Project" onPress={addProject} /> */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <FlatList
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
                    >
                        {category.data.map((item) => (
                            <TouchableOpacity key={item.id} onPress={zoomInPicture}>
                                <View style={styles.displayPictureContainer}>
                                    <View style={{ flex: 1, flexDirection: 'row', columnGap: 15, marginBottom: 5, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                        <TouchableOpacity onPress={() => deleteItem(item)}>
                                            <FontAwesome5 name='trash' size={17} color='black' />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => editItem(item.id, { uri: item.picture })}>
                                            <FontAwesome5 name='edit' size={17} color='black' />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Image source={item.picture == "null" || item.picture != null ? { uri: item.picture } : require('../assets/images.png')} style={styles.imageItem} />
                                        <Text style={styles.name}>{item.category} - No. {item.categoryId}</Text>
                                        <Text style={styles.description}>Description: {item.description || "no description"}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ListItem.Accordion>
                ))}
                {/* <SectionList
                    sections={categoryData}
                    keyExtractor={(item, index) => item + index}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={zoomInPicture}>
                            <View style={styles.displayPictureContainer}>
                                <View style={{ flex: 1, flexDirection: 'row', columnGap: 15, marginBottom: 5, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                    <TouchableOpacity onPress={() => deleteItem(item)}>
                                        <FontAwesome5 name='trash' size={17} color='black' />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => editItem(item.id, { uri: item.picture })}>
                                        <FontAwesome5 name='edit' size={17} color='black' />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <Image source={item.picture == "null" || item.picture != null ? { uri: item.picture } : require('../assets/images.png')} style={styles.imageItem} />
                                    <Text style={styles.name}>{item.category} - No. {item.categoryId}</Text>
                                    <Text style={styles.description}>Description: {item.description || "no description"}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <View>
                            <Text style={styles.sectionHeader}>{title}</Text>
                        </View>
                    )}
                /> */}
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
            opt: null
        };

        index == null ? setImageSections([...imageSections, newSection])
            :
            setImageSections(prevSections => {
                const updatedSections = [...prevSections];
                updatedSections.splice(index + 1, 0, newSection);
                return updatedSections;
            });
    };

    const CameraScreen = () => {
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
                const emptyPictureIndex = imageSections.findIndex(section => section.picture === "");

                if (emptyPictureIndex !== -1) {
                    setImageSections((prevImageSections) => {
                        prevImageSections[emptyPictureIndex] = {
                            id: generateUniqueId(),
                            category: category,
                            categoryId: categoryId,
                            picture: imgUri.node.image.uri,
                            description: '',
                            opt: null
                        };
                        return [...prevImageSections];
                    });
                } else {
                    console.log("inside else")
                    addImageSection(imgUri.node.image.uri);
                }
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
                        style={{ flex: 1 }}
                        device={device}
                        isActive={true}
                        photo={true}
                    />
                    <View style={{ alignItems: 'center' }}>
                        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                            <FontAwesome5 name='camera' size={35} color='black' />
                        </TouchableOpacity>
                    </View>
                    {/* <Button title="Take Photo" onPress={takePhoto} /> */}
                    {/* <Image
                        source={{ uri: imgUri }}
                        style={{ flex: 1 }}
                        resizeMode="contain"
                    /> */}
                </View>
            );
        }
        return <NoCameraDeviceError />;
    }

    return (
        <View style={{ flex: 1, padding: 20, }}>
            {/* <Button title="UPLOAD SHAREPOINT" onPress={uploadImageSharepoint} /> */}
            {/* <CameraScreen /> */}
            <Text style={styles.title}>Pictures</Text>
            <FlatList
                data={imageSections}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.imageSectionContainer}
                renderItem={({ item: section, index }) => (
                    <View style={styles.uploadPictureContainer}>
                        <View style={{ flex: 1, flexDirection: 'row', columnGap: 15, justifyContent: 'flex-end' }}>
                            <TouchableOpacity onPress={() => deleteImageSection(index)}>
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

const styles = StyleSheet.create({
    itemContainer: {
        flex: 1,
        margin: 7,
        padding: 20,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 8,
        backgroundColor: 'white'
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
        // backgroundColor: 'black'
    },
    cameraButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 55,
        height: 55,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#8829A0',
        // backgroundColor: 'black',
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