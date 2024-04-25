/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  TextInput,
  Button, Alert,
  View, FlatList, TouchableOpacity, Modal, Pressable, Image
} from 'react-native';
import { NavigationContainer, useFocusEffect, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Colors,
  DebugInstructions,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Icon from 'react-native-vector-icons/FontAwesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pptxgen from "pptxgenjs";
import RNFS from "react-native-fs";
import { ListItem } from '@rneui/themed';
import CheckBox from '@react-native-community/checkbox';
import axios from 'axios';
import Pinchable from 'react-native-pinchable';
import { btoa, atob, toByteArray } from 'react-native-quick-base64';
import { Settings, retrieveAccessToken } from './src/component/Settings.js';

import { CategoryScreen, token, generateUniqueId, formDigest, CameraScreen } from './src/component/Category';
import BackgroundFetch from 'react-native-background-fetch';

const Stack = createNativeStackNavigator();

export const SettingsContext = createContext();

const categories = [
  { amount: 5, name: 'TNB PE', icon: 'lightbulb' },
  { amount: 15, name: 'Roofs', icon: 'house-chimney' },
  { amount: 10, name: 'Substation Location', icon: 'map-location-dot' },
  { amount: 5, name: 'Storage', icon: 'warehouse' },
  { amount: 15, name: 'MSB Rooms', icon: 'bolt-lightning' },
  { amount: 5, name: 'Hoisting', icon: 'gears' },
  { amount: 15, name: 'Cable Route', icon: 'route' },
  { amount: 10, name: 'FCLR', icon: 'power-off' },
  { amount: 15, name: 'Inverter Location', icon: 'solar-panel' },
  { amount: 15, name: 'Measurement Access', icon: 'ruler' },
];

const ProjectScreen = ({ navigation }) => {
  const [project, setProject] = useState("");
  const [projectNames, setProjectNames] = useState([]);
  const [tokenData, setTokenData] = useState("");

  const goCategory = async (project) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    navigation.navigate("Categories", {
      project: project
    });
  };

  const createProject = async () => {
    if (project.trim() === "") {
      Alert.alert("Error", "Please enter a project name");
      return;
    }
    try {
      // await AsyncStorage.removeItem('projectName');
      const existingProjects = await AsyncStorage.getItem('projectName');
      const parsedExistingProjects = existingProjects ? JSON.parse(existingProjects) : [];

      const isProjectNameExists = parsedExistingProjects.some(existingProject => existingProject === project);

      if (isProjectNameExists) {
        Alert.alert("Error", "Project name already exists");
        return;
      }

      const updatedProjects = [...parsedExistingProjects, project];

      await AsyncStorage.setItem('projectName', JSON.stringify(updatedProjects));
      //************Sharepoint Folder Upload **************/
      try {
        const [accessToken, formDigest] = await retrieveAccessToken();
        const folderUploadUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/folders`
        if (accessToken && formDigest) {
          const response = await axios({
            method: 'POST',
            url: folderUploadUri,
            data: {
              "__metadata": {
                "type": "SP.Folder"
              },
              "ServerRelativeUrl": `ListofImage/${project}`
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              'X-RequestDigest': formDigest,
            },
          });
          console.log("project created:" + project);
        }
      } catch (error) {
        console.log("error in creating project", error);
      }

      Alert.alert("Project Created", "Project name saved successfully", [{ text: "OK", onPress: () => goCategory(project) }]);
    } catch (error) {
      console.error("Error saving project name to AsyncStorage:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const storedProjectNames = await AsyncStorage.getItem('projectName');
      const existingProjectNames = storedProjectNames ? JSON.parse(storedProjectNames) : [];

      setProjectNames(existingProjectNames);
      // if(TokenCredentials.login){
      //   try{
      //     const fetchUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage')?$expand=Folders`;
      //     const response = await axios({
      //       method: 'GET',
      //       url: fetchUri,
      //       headers: {
      //         'Authorization': `Bearer ${TokenCredentials.token}`,
      //         'Accept': 'application/json; odata=verbose',
      //       },
      //     });

      //     const responseData = response.data.d.Folders.results;

      //     // Extract folder names from SharePoint response
      //     const newProjectNames = responseData.map(folder => folder.Name);
      //     console.log(newProjectNames);
      //     // Merge newProjectNames with existingProjectNames and remove duplicates
      //     const updatedProjectNamesSet = new Set([...existingProjectNames, ...newProjectNames]);
      //     const updatedProjectNames = Array.from(updatedProjectNamesSet);

      //     // Update project names state
      //     setProjectNames(updatedProjectNames);
      //     console.log("Retrieved Project from Sharepoint");
      //   }catch(error){
      //     console.log(error.response.data);
      //   }
      // }
    } catch (error) {
      console.error("Error loading project name from AsyncStorage:", error);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      loadProjects();
    }, [])
  );
  return (
    <View style={{ flex: 1, rowGap: 10, padding: 20 }}>
      <TextInput style={{ ...styles.inputContainer, padding: 25, color: '#4b4b4b', fontSize: 25, }}
        placeholder="Project Name"
        placeholderTextColor="#4b4b4b"
        onChangeText={setProject} />
      <Button
        title="Create Your Project"
        onPress={createProject}
      />
      <Text>{tokenData}</Text>
      <Text style={[styles.title, { marginTop: 10 }]}>Project History</Text>
      <FlatList
        data={projectNames}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => goCategory(item)}
          >
            <Text style={styles.projectName}>{item}</Text>

          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const HomeScreen = ({ setCategoryName, route, navigation }) => {
  const { project } = route.params;
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [tempHolder, setTempHolder] = useState("");

  const goCategory = (name) => {
    setCategoryName(name);
    setTempHolder(name);
    setShouldNavigate(true);
  };

  useEffect(() => {
    const navigateAsync = async () => {
      if (shouldNavigate) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigation.navigate(tempHolder, {
          project: project,
          category: tempHolder,
          amount: categories.find(item => item.name === tempHolder).amount,
          categoryId: null
        });
        setShouldNavigate(false);
      }
    };

    navigateAsync();
  }, [shouldNavigate]);

  const [isDataFetched, setIsDataFetched] = useState(false);
  const projectRef = useRef(null);
  const [data, setData] = useState();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accessToken, formDigest] = await retrieveAccessToken();

        const storedDataJSON = await AsyncStorage.getItem('sharePointData');

        // if (storedDataJSON || projectRef.current === project) {
        //   console.log(storedDataJSON);
        //   setIsDataFetched(true);
        //   return;
        // }

        // ************Fetch Sharepoint Data***********
        const fetchUri = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl('ListofImage/${project}')?$expand=Folders`;
        const response = await axios({
          method: 'GET',
          url: fetchUri,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json; odata=verbose',
          },
        });

        const responseData = response.data.d.Folders.results;
        let newData = [];
        await Promise.all(responseData.map(async (folder) => {
          const folderName = folder.Name;
          const foldersUri = folder.Folders.__deferred.uri;

          try {
            // Fetch the CategoryID
            const foldersResponse = await axios({
              method: 'GET',
              url: foldersUri,
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': "application/json;odata=verbose",
              },
            });

            if (foldersResponse.status === 200 && foldersResponse.data.d.results) {
              const subfolder = foldersResponse.data.d.results;
              // Fetch files inside the Category ID
              for (const subfiles of subfolder) {
                const subfilesName = subfiles.Name;
                const filesUri = subfiles.Files.__deferred.uri + '/$value';
                try {
                  // fetch cateogry ID
                  const filesResponse = await axios({
                    method: 'GET',
                    url: filesUri,
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Accept': 'application/json; odata=verbose',
                      'Content-Type': 'image/jpg'
                    },
                    responseType: 'arraybuffer'
                  });
                  // const arrayBuffer = await toByteArray(filesResponse);
                  if (filesResponse.status === 200 && filesResponse.data.d.results) {
                    if (filesResponse.data.d.results.length !== 0) {
                      // const fileNamesInSubfolder = filesResponse.data.d.results.map(file => file.Name);
                      const files = filesResponse.data.d.results;
                      console.log("the files are: " + files);
                      // console.log(files);
                      for (const file of files) {
                        const pictureName = file.Name;
                        const picture = file.ServerRelativeUrl;
                        // console.log(picture)
                        newData.push({
                          id: generateUniqueId(),
                          project: project,
                          category: folderName,
                          categoryId: subfilesName,
                          picture: `https://solarvest.sharepoint.com${picture}`,
                          description: pictureName.split('_').slice(-2, -1)[0].replace('.jpg', ''),
                          opt: null
                        });
                        // console.log(`https://solarvest.sharepoint.com${picture}`);
                      }
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
        }));
        // console.log("new data is :" + newData);
        // Store fileNames in AsyncStorage
        await AsyncStorage.setItem('sharePointData', JSON.stringify(newData));
        setData(newData);
      } catch (error) {
        console.log("Error in fetching data: " + error);
      }
    }

    if (!isDataFetched || projectRef.current !== project) {
      projectRef.current = project;
    }
    // if (TokenCredentials.login) {
    //   fetchData();
    // }
  }, []);

  const [projectData, setProjectData] = useState([]);

  const formatData = (data, project) => {
    const filteredData = data.filter(item =>
      item.project === project && item.opt != 'delete'
    );

    const sections = filteredData.reduce((acc, item) => {
      const categoryKey = `${item.category}`;
      const categoryIdKey = `${item.categoryId}`;

      if (!acc[categoryKey]) {
        acc[categoryKey] = {};
      }

      if (!acc[categoryKey][categoryIdKey]) {
        acc[categoryKey][categoryIdKey] = [];
      }

      acc[categoryKey][categoryIdKey].push({
        ...item
      });

      return acc;
    }, {});

    return categories.map(({ name }) => {
      const categoryData = sections[name] || {};

      return {
        title: name,
        data: Object.entries(categoryData).map(([categoryId, items]) => ({
          title: `No. ${categoryId}`,
          data: items
        }))
      };
    }).filter(({ data }) => data.length > 0);
  };

  const tempFetch = async () => {
    //temporary data Fetching
    try {
      const storedDataJSON = await AsyncStorage.getItem('imageCategory');
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];

      setProjectData(formatData(storedData, project));
    } catch (error) {
      console.log(error);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      tempFetch();
    }, [])
  );

  const [expandedSections, setExpandedSections] = useState({});
  const toggleSection = (sectionTitle) => {
    setExpandedSections({
      ...expandedSections,
      [sectionTitle]: !expandedSections[sectionTitle],
    });
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 20, rowGap: 15 }}>
        <FlatList
          data={categories}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemContainer} onPress={() => goCategory(item.name)}>
              <Icon name={item.icon} size={20} color='#8829A0' />
              <Text style={styles.categoryName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <PptModal projectData={projectData} project={project} />
        {/* <Button title="get data" onPress={fetchSharePointData} /> */}
        <View>
          <Text style={styles.title}>Pictures</Text>
          {projectData.map((category) => (
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
              {category.data.map((categoryIdGroup) => (
                <ListItem.Accordion
                  key={`category-${category.title}-${categoryIdGroup.title}`}
                  content={
                    <>
                      <Text style={{ ...styles.sectionHeader, backgroundColor: '#8829A0' }}>{categoryIdGroup.title}</Text>
                    </>
                  }
                  isExpanded={expandedSections[`category-${category.title}-${categoryIdGroup.title}`] || false}
                  onPress={() => toggleSection(`category-${category.title}-${categoryIdGroup.title}`)}
                  containerStyle={{ backgroundColor: 'transparent' }}
                >
                  {categoryIdGroup.data.map((item) => (
                    <View key={item.id}>
                      <View style={styles.displayPictureContainer}>
                        <View style={{ alignItems: 'center' }}>
                          <Pinchable>
                            <Image source={item.picture == "null" || item.picture != null ? { uri: item.picture } : require('./src/assets/images.png')} style={styles.imageItem} />
                          </Pinchable>
                          <Text style={styles.name}>{item.category} - No. {item.categoryId}</Text>
                          <Text style={styles.description}>Description: {item.description || "no description"}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ListItem.Accordion>
              ))}
            </ListItem.Accordion>
          ))}
          {/* {Object.values(data).map(item => (
            <View style={{flex:1}} key={item.id}>
              <Text>{item.category} - No. {item.categoryId}</Text>
              <Text>Description: {item.description || "no description"}</Text>
              <Text>{item.picture}</Text>
              <Image source={{ uri: item.picture }} style={{ width: 100, height: 100 }} />
              <Image source ={{uri: 'https://solarvest.sharepoint.com/:i:/r/sites/ProjectDevelopment/ListofImage/testing/TNB%20PE/1/171286429110116_undefined_TNB%20PE_1_.jpg?csf=1&web=1&e=gehA6u'}} style={{ width: 100, height: 100 }} />
            </View>
          ))} */}
          {/* <Button title="see fetched Data" onPress={async () => {
            const storedDataJSON = await AsyncStorage.getItem('imageCategory');
            const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
            console.log(storedData);
          }} /> */}
        </View>
      </ScrollView>
    </>
  );
};

const PptModal = ({ projectData, project, }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const initialSelectedHeaders = projectData.map((category) => category.title);

    const initialSelectedItems = projectData.reduce((acc, category) => {
      return acc.concat(
        category.data.reduce((innerAcc, categoryIdGroup) => {
          return innerAcc.concat(
            categoryIdGroup.data.map((item) => `${item.category}No. ${item.categoryId}`)
          );
        }, [])
      );
    }, []);

    const uniqueInitialSelectedItems = [...new Set(initialSelectedItems)];

    setSelectedHeaders(initialSelectedHeaders);
    setSelectedItems(uniqueInitialSelectedItems);
  }, [projectData]);

  useEffect(() => {
    const filteredSelectedHeaders = selectedHeaders.filter(header => {
      return projectData.some(category => category.title === header);
    });
    setSelectedHeaders(filteredSelectedHeaders);
  }, [selectedItems]);

  const handleHeaderCheck = (headerName, isChecked) => {
    if (isChecked) {
      setSelectedHeaders((prevHeaders) => [...prevHeaders, headerName]);
    } else {
      setSelectedHeaders((prevHeaders) => prevHeaders.filter((header) => header !== headerName));
    }
  };

  const handleItemCheck = (itemName, isChecked) => {
    if (isChecked) {
      setSelectedItems((prevItems) => [...prevItems, itemName]);
    } else {
      setSelectedItems((prevItems) => prevItems.filter((item) => item !== itemName));
    }
  };

  const uploadReport = async (fileData, reportName) => {
    const fileUploadUrl = `https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web/GetFolderByServerRelativeUrl(\'/sites/ProjectDevelopment/ListofImage/${project}\')/Files/add(url=\'${reportName}\',overwrite=true)`;

    const arrayBuffer = toByteArray(fileData);
    try {
      const [accessToken, formDigest] = await retrieveAccessToken();

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'X-RequestDigest': formDigest,
        'Accept': 'application/json; odata=verbose',
      }
      const response = await axios({
        method: 'POST',
        url: fileUploadUrl,
        data: arrayBuffer,
        headers: headers,
      });
      if (response.data.d.Exists) {
        console.log("Report Uploaded to Sharepoint: " + reportName);
        return true;
      }
      console.log(response.data.d.Exists);
    } catch (error) {
      console.log("Error Uploading Data in Sharepoint", error.response.data);
      return false
    }
  };

  const generatePowerpoint = async () => {
    try {
      const storedDataJSON = await AsyncStorage.getItem('imageCategory');
      const storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
      const filteredData = storedData.filter(item => {
        const isItemChecked = selectedItems.includes(`${item.category}No. ${item.categoryId}`);
        const matchProject = item.project === project;

        return isItemChecked && matchProject;
      });

      let ppt = new pptxgen();

      const sortedData = filteredData.sort((a, b) => {
        // First, sort by name
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;

        // If names are equal, sort by categoryId
        return a.categoryId - b.categoryId;
      });
      const groupedData = {};
      sortedData.forEach(item => {
        const { category } = item;
        if (!groupedData[category]) {
          groupedData[category] = [];
        }
        groupedData[category].push(item);
      });
      // const backgroundPath = RNFS.MainBundlePath + '/src/assets/solarvestFirstBackground.png';
      // console.log(RNFS.MainBundlePath);
      const firstPage = ppt.addSlide();
      // firstPage.addImage({
      //   // path: './src/assets/solarvestFirstBackground.png',
      //   path: backgroundPath,
      //   x: 0,
      //   y: 0,
      //   w: '100%',
      //   h: '100%',
      //   sizing: {
      //     type: 'cover'
      //   }
      // });
      firstPage.addText("Client:", {
        x: 1.5,
        y: 1.5,
        w: '5%',
        h: 1,
        fontSize: 18,
        bold: true,
        color: '#666666'
      });
      firstPage.addText("LOGO", {
        x: 1.5,
        y: 2,
        w: '10%',
        h: 1,
        fontSize: 20,
        bold: true,
        color: '#666666'
      });
      firstPage.addText("PROJECT NAME", {
        x: 1.5,
        y: 2,
        w: '10%',
        h: 1,
        fontSize: 20,
        bold: true,
        color: '#666666'
      });
      const formattedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '').replace(/(\d)(st|nd|rd|th)/, '$1$2');
      firstPage.addText(`Brief Summary| ${formattedDate}`, {
        x: 1.75,
        y: 2,
        w: '10%',
        h: 1,
        fontSize: 20,
        bold: true,
        color: '#666666'
      });

      for (const [category, items] of Object.entries(groupedData)) {

        // Add a new slide for the category
        const categorySlide = ppt.addSlide();
        categorySlide.addText(`Project: ${project}`, {
          x: 1,
          y: 1,
          w: '80%',
          h: 1.5,
          fontSize: 48,
          bold: true,
          color: '000000'
        });

        categorySlide.addText(`Category: ${category}`, {
          x: 1,
          y: 2,
          w: '80%',
          h: 1.5,
          fontSize: 48,
          bold: true,
          color: '000000'
        });

        // Iterate over the items under the current category to create slides
        items.forEach((item, index) => {
          const { categoryId, picture, description } = item;
          const itemSlide = ppt.addSlide();
          // Add categoryId as a small header
          itemSlide.addText(`${category} - No. ${categoryId}`, {
            x: 1,
            y: 0.5,
            w: '40%',
            h: 1,
            fontSize: 32,
            italic: true,
            color: '000000'
          });

          // Add description as text
          itemSlide.addText(description || 'No description available', {
            x: 1,
            y: 1,
            w: '40%',
            h: '80%',
            fontSize: 24,
            color: '000000'
          });

          // Add picture as an image
          itemSlide.addImage({
            path: picture,
            x: 5,
            y: 1,
            w: 4,
            h: 4
          });
        });
      }
      const base64 = await ppt.write("base64");
      const timestamp = new Date().getTime();

      const reportName = `${project}_${timestamp}.pptx`
      const filePath = `${RNFS.DownloadDirectoryPath}/${reportName}`;
      await RNFS.writeFile(filePath, base64, 'base64');
      console.log(`File saved successfully at: ${filePath}`);
      uploadReport(base64, reportName);
      setModalVisible(!modalVisible);
      console.log('PowerPoint file saved successfully:', reportName);
    } catch (error) {
      console.error('Error saving the PowerPoint file:', error);
    }
  }

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>

        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View>
              {projectData.map((category, index) => (
                <Accordion
                  key={index}
                  category={category}
                  onHeaderCheck={handleHeaderCheck}
                  onItemCheck={handleItemCheck}
                />
              ))}
            </View>
          </ScrollView>
          {/* <Button title={"GENERATE"} onPress={generatePowerpoint} /> */}
          <Button title={"GENERATE"} onPress={generatePowerpoint} />
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => setModalVisible(!modalVisible)}>
            <Text style={styles.textStyle}>CLOSE</Text>
          </Pressable>
        </View>
      </Modal>
      <Button title='GENERATE REPORT' onPress={() => setModalVisible(true)} />
    </View>
  )
}

const Accordion = ({ category, onHeaderCheck, onItemCheck }) => {
  const [expanded, setExpanded] = useState(false);

  // Initialize itemCheckedState with all checkboxes set to true
  const initialItemCheckedState = {};
  category.data.forEach((categoryIdGroup) => {
    initialItemCheckedState[`${category.title}${categoryIdGroup.title}`] = true;
  });

  const [itemCheckedState, setItemCheckedState] = useState(initialItemCheckedState);

  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionTitle) => {
    setExpandedSections({
      ...expandedSections,
      [sectionTitle]: !expandedSections[sectionTitle],
    });
  };

  const handleItemCheck = (item, isChecked) => {
    const updatedItemCheckedState = {
      ...itemCheckedState,
      [item]: isChecked,
    };

    setItemCheckedState(updatedItemCheckedState);
    onItemCheck(item, isChecked);
  };

  const handleHeaderCheck = (headerTitle, isChecked) => {
    const updatedItemCheckedState = {};
    category.data.forEach((categoryIdGroup, index) => {
      updatedItemCheckedState[`${headerTitle}${categoryIdGroup.title}`] = isChecked;
      onItemCheck(`${headerTitle}${categoryIdGroup.title}`, isChecked)
    });
    setItemCheckedState(updatedItemCheckedState);

    onHeaderCheck(headerTitle, isChecked);
  };


  return (
    <ListItem.Accordion
      content={
        <>
          <CheckBox
            value={Object.values(itemCheckedState).some(Boolean)}
            onValueChange={(newValue) => {
              handleHeaderCheck(category.title, newValue);
            }}
          />
          <Text>{category.title}</Text>
        </>
      }
      isExpanded={expanded}
      onPress={() => {
        setExpanded(!expanded);
      }}
      containerStyle={{ backgroundColor: 'transparent' }}
    >
      {category.data.map((categoryIdGroup) => (
        <ListItem.Accordion
          key={`${category.title}${categoryIdGroup.title}`}
          content={
            <>
              <CheckBox
                value={itemCheckedState[`${category.title}${categoryIdGroup.title}`]}
                onValueChange={(newValue) => handleItemCheck(`${category.title}${categoryIdGroup.title}`, newValue)}
              />
              <Text>{categoryIdGroup.title}</Text>
            </>
          }
          isExpanded={expandedSections[`${category.title}${categoryIdGroup.title}`] || false}
          onPress={() => toggleSection(`${category.title}${categoryIdGroup.title}`)}
          containerStyle={{ backgroundColor: 'transparent' }}
        >
          {categoryIdGroup.data.map((item) => (
            <View key={item.id}>
              <View style={styles.displayPictureContainer}>
                <View style={{ alignItems: 'center' }}>
                  <Image source={item.picture == "null" || item.picture != null ? { uri: item.picture } : require('./src/assets/images.png')} style={styles.imageItem} />
                  <Text style={styles.name}>{item.category} - No. {item.categoryId}</Text>
                  <Text style={styles.description}>Description: {item.description || "no description"}</Text>
                </View>
              </View>
            </View>
          ))}
        </ListItem.Accordion>
      ))}
    </ListItem.Accordion>
  );
};

const LoginPage = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const doUserLogIn = async () => {
    // if (username === 'SolarvestSiteSurvey00' && password === 'SV890432') {
    console.log("login");
    if (username === 'username' && password === 'password') {
      Alert.alert('Login Successful', 'You have successfully logged in!');
      await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true)); // Save login state
      navigation.navigate('Project');
    } else {
      Alert.alert('Login Failed', 'Invalid username or password.');
    }
  };

  return (
    <View style={styles.loginForm}>
      <Image source={require('./src/assets/solarvestlogo.png')} style={{ resizeMode: 'contain', width: '100%', height: '100%', maxHeight: 400 }} />
      <TextInput
        style={styles.inputField}
        value={username}
        placeholder={'Username'}
        onChangeText={(text) => setUsername(text)}
        autoCapitalize={'none'}
        keyboardType={'email-address'}
      />
      <TextInput
        style={styles.inputField}
        value={password}
        placeholder={'Password'}
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
      />
      <TouchableOpacity onPress={doUserLogIn}>
        <View style={styles.loginButton}>
          <Text style={styles.buttonText}>{'Sign in'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

function HeaderButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
      <Icon name={'user-gear'} size={25} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [AccessToken, setAccessToken] = useState(null);
  const [formDigest, setFormDigest] = useState(null);
  const [login, setLogin] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await retrieveAccessToken();
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        if (value !== null) {
          setLogin(JSON.parse(value));
        } else {
          setLogin(false);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
    loadSettings();
  }, []);

  const initBackgroundFetch = async () => {
    let status = await BackgroundFetch.configure({
      minimumFetchInterval: 240,
      stopOnTerminate: false,
    }, async (taskId) => {  // <-- Event callback
      // This is the fetch-event callback.
      console.log("[BackgroundFetch] taskId: ", taskId);
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
          });
        } catch (error) {
          console.log("error uploading Folder")
        }
      };

      try {
        const [AccessToken, formDigest] = await retrieveAccessToken();
        console.log("Accesstoken: " + AccessToken)
        console.log("formDigest: " + formDigest)
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
              console.log(error.response.data);
            }
          }
        }));

      } catch (error) {
        console.log(error);
      }
      BackgroundFetch.finish(taskId);
    }, async (taskId) => {  // <-- Task timeout callback
      // This task has exceeded its allowed running-time.
      console.warn('[BackgroundFetch] TIMEOUT task: ', taskId);
      BackgroundFetch.finish(taskId);
    });

    console.log('[BackgroundFetch] configure status: ', status);
  };

  useEffect(() => {
    initBackgroundFetch();
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const [categoryName, setCategoryName] = useState('Category');
  if (login === null) {
    return null; // Don't render anything while login is null
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={login ? 'Project' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#8829A0',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <HeaderButton />
          ),
        }}>
        <Stack.Screen name="Login" component={LoginPage} options={{ headerRight: () => null }} />
        <Stack.Screen name="Project" component={ProjectScreen} />
        <Stack.Screen name="Categories">
          {(props) => <HomeScreen {...props} setCategoryName={setCategoryName} />}
        </Stack.Screen>
        <Stack.Screen name={categoryName} component={CategoryScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  //login page
  loginForm: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputField: {
    width: '100%',
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  loginButton: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  //modal style
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    height: '90%',
    rowGap: 5
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  //others
  category_background: {
    backgroundColor: "#8829A0",
    alignItems: "center",
    padding: 20
  },
  inputContainer: {
    width: '100%',
    height: 45,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444'
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    columnGap: 5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 8,
    backgroundColor: 'white'
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black'
  },
  categoryName: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black'
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
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
});

export default App;
