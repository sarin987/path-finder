import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

const HomeScreen = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const navigation = useNavigation();
  const trackingInterval = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert("Permission Denied", "Location permission is required.");
          setLoading(false);
        }
      } catch (err) {
        Alert.alert("Error", "Failed to request location permission.");
        setLoading(false);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setLocation(newLocation);
        setLoading(false);
      },
      (error) => {
        Alert.alert("Location Error", "Unable to fetch location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const toggleTracking = () => {
    if (!trackingEnabled) {
      Alert.alert("Tracking Enabled", "Your location is now visible to nearby policemen.");
      trackingInterval.current = setInterval(() => {
        Geolocation.getCurrentPosition(
          async (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(newLocation);
            // Send location to backend
            await axios.post("http://192.168.14.103:5000/api/location/update", {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              userId: "USER_ID_HERE",
            });
          },
          (error) => console.error(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
      }, 5000);
    } else {
      clearInterval(trackingInterval.current);
      Alert.alert("Tracking Disabled", "Live tracking has been stopped.");
    }
    setTrackingEnabled(!trackingEnabled);
  };

  const showPopup = (message) => {
    setModalText(message);
    setModalVisible(true);
    setTimeout(() => setModalVisible(false), 2000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.sidebarButton}
        onPress={() => navigation.openDrawer()}
      >
        <Image source={require("../assets/hamburger.png")} style={styles.sidebarIcon} />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : location ? (
        <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={location} showsUserLocation={true}>
          <Marker coordinate={location}>
            <Image source={require("../assets/location_pin.png")} style={styles.icon} />
          </Marker>
        </MapView>
      ) : (
        <Text style={styles.fetchingText}>Fetching location...</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={() => showPopup("Nearby ambulances")}>
          <Image source={require("../assets/ambulance.png")} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => showPopup("Nearby police stations")}>
          <Image source={require("../assets/police_car.png")} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => showPopup("Nearby policemen")}>
          <Image source={require("../assets/policeman.png")} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, trackingEnabled ? styles.trackingActive : {}]} onPress={toggleTracking}>
          <Image source={require("../assets/house.png")} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sosButton} onPress={() => showPopup("SOS alert sent!")}>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{modalText}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  map: { flex: 1 },
  fetchingText: { textAlign: "center", marginTop: 20, fontSize: 18, color: "#333" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  sidebarButton: { position: "absolute", top: 20, left: 20, zIndex: 10 },
  sidebarIcon: { width: 35, height: 35 },
  buttonContainer: { position: "absolute", top: "30%", right: 20, alignItems: "center" },
  iconButton: { backgroundColor: "rgba(255, 255, 255, 0.9)", padding: 10, borderRadius: 50, marginVertical: 10 },
  trackingActive: { backgroundColor: "#00aaff" },
  icon: { width: 30, height: 30 },
  sosButton: { backgroundColor: "red", width: 65, height: 65, borderRadius: 40, alignItems: "center", justifyContent: "center", elevation: 5, marginTop: 15 },
  sosText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default HomeScreen;
