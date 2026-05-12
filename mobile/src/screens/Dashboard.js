import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));

        const res = await api.get('/medications');
        setMedications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const renderMedItem = ({ item }) => (
    <View style={styles.medCard}>
      <View style={styles.medIconBox}>
        <Ionicons name="medical-outline" size={24} color="#6c5ce7" />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{item.name}</Text>
        <Text style={styles.medDose}>{item.dose} - {item.scheduleTime}</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="checkmark-circle" size={32} color="#00b894" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#d63031" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={medications}
            keyExtractor={(item) => item._id}
            renderItem={renderMedItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="medical-outline" size={60} color="#dfe6e9" />
                <Text style={styles.emptyText}>No medications scheduled for today.</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FullWebApp')}>
        <Ionicons name="apps" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#636e72',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2d3436',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#f1f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: {
    flex: 1,
    marginLeft: 16,
  },
  medName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  medDose: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 2,
  },
  actionBtn: {
    padding: 4,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#636e72',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
