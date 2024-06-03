/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from "react-native-fs";
import axios from 'axios';
import { btoa, atob, toByteArray } from 'react-native-quick-base64';
import { Settings, retrieveAccessToken } from './src/component/Settings.js';
import NetInfo from "@react-native-community/netinfo";
import BackgroundService from 'react-native-background-actions';

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

const backgroundTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;
    await new Promise(async (resolve) => {
        for (let i = 0; BackgroundService.isRunning(); i++) {
            await checkConnectivityAndExecute();
            await sleep(delay);
        }
    });
};

const checkConnectivityAndExecute = async () => {
    const state = await NetInfo.fetch();
    const loadImageBase64 = async (capturedImageURI) => {
        try {
            const base64Data = await RNFS.readFile(capturedImageURI, 'base64');
            return base64Data;
        } catch (error) {
            console.error('Error converting image to base64:', error);
        }
    };

    const uploadImageSharepoint = async (imgUri, imgName, folderUri, AccessToken, formDigest) => {
        const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${folderUri}\')/Files/add(url=\'${imgName}\',overwrite=true)`;
        const base64Image = await loadImageBase64(imgUri);
        const headers = {
            'Authorization': `Bearer ${AccessToken}`,
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
            console.log("Error Uploading Data in Sharepoint", error.response.data);
            return false
        }
    };

    const checkFolderExist = async (project, folderUri, AccessToken, formDigest) => {
        const checkUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${folderUri}')`
        const uploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`;
        let folderExist = true;
        try {
            const response = await axios.get(checkUri, {
                headers: {
                    'Authorization': `Bearer ${AccessToken}`,
                    'Accept': 'application/json;odata=verbose',
                },
            });

            console.log('File Exist: ' + response.data.d.Exists);
            return response.data.d.Exists;
        } catch (error) {
            // *********Create sharepoint folder path***********
            if (error.response.data.error.code == "-2147024894, System.IO.FileNotFoundException") {
                let parentFolder = project;
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
                                'Authorization': `Bearer ${AccessToken}`,
                                'Accept': 'application/json;odata=verbose',
                                'Content-Type': 'application/json;odata=verbose',
                                'X-RequestDigest': formDigest,
                            },
                        });
                        parentFolder += '/' + path;
                        // console.log("Folder created: " + response.data.d.Exists);
                        // folderExist = response.data.d.Exists;
                    } catch (error) {
                        console.log(error);
                        return false;
                    }
                }
            }
        }
        return folderExist;
    };

    const checkDate = async () => {
        // console.log("check the date" + (new Date.getTime()))
        try {
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            const currentDate = new Date().getTime();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;

            storedData = storedData.filter((dataItem) => {
                const createdDate = parseInt(dataItem.id.substring(0, dataItem.id.length - 3));
                const isOlderThanSevenDays = currentDate - createdDate > sevenDays;
                const isOptNull = dataItem.opt === null;
                const isOptDelete = dataItem.opt === 'delete';

                // Keep the item if it's not older than seven days, opt is not null, and opt is not 'delete'
                return !(isOlderThanSevenDays && isOptNull) && !isOptDelete;
            });

            await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
        } catch (error) {
            console.log("There is an error inside ", error);
        }
    }

    const uploadProjectFolder = async (AccessToken, formDigest) => {
        try {
            const existingProjects = await AsyncStorage.getItem('projectName');
            const ExistingProjects = existingProjects ? JSON.parse(existingProjects) : [];
            ExistingProjects.forEach(async (projectName) => {
                try {
                    const checkFolderUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${projectName}')`
                    const response = await axios({
                        method: 'GET',
                        url: checkFolderUri,
                        headers: {
                            'Authorization': `Bearer ${AccessToken}`,
                            'Accept': 'application/json;odata=verbose'
                        },
                    });
                } catch (error) {
                    console.log("error in checking if the folder exist");
                    try {
                        if (error.response.data.error.message.value == "File Not Found."){
                            try {
                                const folderUploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`
                                const response = await axios({
                                    method: 'POST',
                                    url: folderUploadUri,
                                    data: {
                                        "__metadata": {
                                            "type": "SP.Folder"
                                        },
                                        "ServerRelativeUrl": `ListofImage/${projectName}`
                                    },
                                    headers: {
                                        'Authorization': `Bearer ${AccessToken}`,
                                        'Accept': 'application/json;odata=verbose',
                                        'Content-Type': 'application/json;odata=verbose',
                                        'X-RequestDigest': formDigest,
                                    },
                                });
                                console.log("project created:" + projectName);
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    } catch (error) {
                        console.log("this is the error" + error);
                    }
                }
            });
        } catch (error) {
            console.log("error uploading Folder")
        }
    };
    if (state.isConnected) {
        try {
            const [AccessToken, formDigest] = await retrieveAccessToken();
            await uploadProjectFolder(AccessToken, formDigest);
            checkDate();
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            const filteredData = storedData.filter(item => item.opt !== null);
            // console.log("filtered Data:", filteredData);
            await Promise.all(filteredData.map(async (item) => {
                if (item.opt === "create") {
                    // ***********sharepoint upload***********
                    const folderUri = `${item.project}/${item.category}/${item.categoryId}`;
                    const folderExist = await checkFolderExist(item.project, folderUri, AccessToken, formDigest);
                    if (folderExist) {
                        const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
                        try {
                            const imgUploaded = await uploadImageSharepoint(item.picture, imgName, folderUri, AccessToken, formDigest);
                            if (imgUploaded) {
                                const storedDataJSON = await AsyncStorage.getItem('imageCategory');
                                let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
                                item.opt = null;
                                const index = storedData.findIndex(dataItem => dataItem.id === item.id);

                                if (index !== -1) {
                                    storedData[index] = item;
                                    await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                                }

                                const currentDate = new Date().getTime();
                                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                                const createdDate = parseInt(item.id.substring(0, item.id.length - 3));
                                if (currentDate - createdDate > sevenDays) {
                                    RNFS.unlink(item.picture)
                                        .then(() => {
                                            console.log('FILE DELETED from local');
                                        })
                                        .catch((err) => {
                                            console.log(err.message);
                                        });
                                    storedData = storedData.filter(dataItem => dataItem.id !== item.id);
                                    await AsyncStorage.setItem('imageCategory', JSON.stringify(storedData));
                                } else {
                                    const indexToUpdate = storedData.findIndex(dataItem => dataItem.id === item.id && item.opt === 'create');

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
                                }
                            }
                        } catch (error) {
                            console.log("error uploading to sharepoint", error);
                        }
                    }
                } else if (item.opt === "delete") {
                    const imgName = `${item.id}_${item.project}_${item.category}_${item.categoryId}_${item.description}.jpg`;
                    const deleteUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFileByServerRelativeUrl('/sites/ProjectDevelopment/ListofImage/${item.project}/${item.category}/${item.categoryId}/${imgName}')`
                    try {
                        const response = await axios({
                            method: 'POST',
                            url: deleteUri,
                            headers: {
                                'Authorization': `Bearer ${AccessToken}`,
                                'If-Match': '{etag or *}',
                                'X-HTTP-Method': 'DELETE',
                                'X-RequestDigest': formDigest,
                            },
                        });
                        const indexToUpdate = storedData.findIndex(items => items.id === item.id);
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
            }));
            // const uploadImageSharepoint = filteredData.filter(item => item.opt === "create");
            // if (uploadImageSharepoint) {
            //     PushNotification.localNotification({
            //         title: "Picture Upload Complete",
            //         message: "Picture that you have taken offline has been uploaded to sharepoint",
            //     });
            // }
        } catch (error) {
            console.log(error);
        }
    }
};

const options = {
    taskName: 'Offline Upload Check',
    taskTitle: 'Offline Upload Check',
    taskDesc: 'Checking for internet to upload offline pictures taken by the app',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#ff00ff',
    parameters: {
        delay: 14400000
        // delay: 100000,
    },
};

BackgroundService.start(backgroundTask, options);


AppRegistry.registerComponent(appName, () => App);
