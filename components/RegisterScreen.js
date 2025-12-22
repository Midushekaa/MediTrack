import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import API from '../services/api';


export default function RegisterScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [name, setName] = useState('');


const handleRegister = async () => {
try {
await API.post('/auth/register', { name, email, password });
navigation.navigate('Login');
} catch (err) {
console.error(err);
}
};


return (
<View>
<Text>Name:</Text>
<TextInput value={name} onChangeText={setName} />
<Text>Email:</Text>
<TextInput value={email} onChangeText={setEmail} />
<Text>Password:</Text>
<TextInput value={password} onChangeText={setPassword} secureTextEntry />
<Button title="Register" onPress={handleRegister} />
</View>
);
}