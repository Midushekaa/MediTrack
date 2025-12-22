import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import API from '../services/api';


export default function LoginScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');


const handleLogin = async () => {
try {
const res = await API.post('/auth/login', { email, password });
localStorage.setItem('token', res.data.token);
navigation.navigate('Dashboard');
} catch (err) {
console.error(err);
}
};


return (
<View>
<Text>Email:</Text>
<TextInput value={email} onChangeText={setEmail} />
<Text>Password:</Text>
<TextInput value={password} onChangeText={setPassword} secureTextEntry />
<Button title="Login" onPress={handleLogin} />
<Button title="Register" onPress={() => navigation.navigate('Register')} />
</View>
);
}