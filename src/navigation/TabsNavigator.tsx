// src/navigation/TabsNavigator.tsx

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import FloatingTabBar from "./FloatingTabBar";
import Search from "../screens/Search";
import Blog from "../screens/Blog";
import AddProperty from "../screens/AddProperty";
import Credite from "../screens/Credite";
import Contact from "../screens/Contact";
import AppLoader from "../components/AppLoader";
import FavoritesScreen from "../screens/FavoritesScreen";
import PropertyAssistant from "../components/PropertyAssistant";

export default function TabsNavigator({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState("Search");
  const [appLoading, setAppLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setAppLoading(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {activeTab === "Search"      && <Search   navigation={navigation} />}
        {activeTab === "Blog"        && <Blog     navigation={navigation} />}
        {activeTab === "AddProperty" && <AddProperty navigation={navigation} />}
        {activeTab === "Credite"     && <Credite />}
        {activeTab === "Contact"     && <Contact  navigation={navigation} />}
        {activeTab === "Favorite" && (
          <FavoritesScreen
            navigation={navigation}
            isActive={activeTab === "Favorite"}
            onNavigateToTab={(tabName) => setActiveTab(tabName)}
          />
        )}
      </View>

      <PropertyAssistant />
      
      <FloatingTabBar
        {...({
          state: { routes: [{ name: activeTab, key: activeTab }], index: 0 },
          navigation: {
            navigate: (n: string) => setActiveTab(n),
            addListener: () => () => {},
          },
        } as any)} 
      />

      {appLoading && (
        <View style={StyleSheet.absoluteFillObject}>
          <AppLoader visible={appLoading} onFinish={() => setAppLoading(false)} />
        </View>
      )}
    </View>
  );
}
