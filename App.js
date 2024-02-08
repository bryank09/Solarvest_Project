/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View, FlatList, TouchableOpacity
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Colors,
  DebugInstructions,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import MatIcon from 'react-native-vector-icons/MaterialIcons';

import Header from './src/component/Header';
import CategoryScreen from './src/component/Category';


const Stack = createNativeStackNavigator();

const categories = [
  { amount: 5, name: 'Category 1' },
  { amount: 5, name: 'Category 2' },
  { amount: 5, name: 'Category 3' },
  { amount: 6, name: 'Category 4' },
  { amount: 2, name: 'Category 5' },
  { amount: 4, name: 'Category 6' },
];

const HomeScreen = ({ setCategoryName, navigation }) => {
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
          category: tempHolder,
          amount: categories.find(item => item.name === tempHolder).amount,
        });
        setShouldNavigate(false);
      }
    };
    navigateAsync();
  }, [shouldNavigate]);

  return (
    <>
      <Header />
      <FlatList
        data={categories}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemContainer} onPress={() => goCategory(item.name)}>
            <MatIcon name="category" size={20} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </>
  );
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [categoryName, setCategoryName] = useState('Category');

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} setCategoryName={setCategoryName} />}
        </Stack.Screen>
        <Stack.Screen name={categoryName} component={CategoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  category_background: {
    backgroundColor: "#8829A0",
    alignItems: "center",
    padding: 20
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    columnGap: 5,
    justifyContent: 'center',
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
});

export default App;
