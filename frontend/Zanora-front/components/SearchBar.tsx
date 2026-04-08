import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { SuggestionDTO } from '../services/Propertyservice';

interface Props {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: SuggestionDTO[];
  onSelectSuggestion: (item: SuggestionDTO) => void;
  loading?: boolean;
  icon?: React.ReactNode | string;
}

const SearchBar: React.FC<Props> = ({
  placeholder,
  value,
  onChangeText,
  suggestions,
  onSelectSuggestion,
  loading = false,
  icon = '🔍',
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const showDropdown = focused && suggestions.length > 0;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  useEffect(() => {
    Animated.spring(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [showDropdown]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.inputRow, { borderColor }]}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {loading && (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
        )}
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => {
                  onSelectSuggestion(item);
                  setFocused(false);
                }}
              >
                <Text style={styles.suggestionName}>{item.name}</Text>
                {item.parentName && (
                  <Text style={styles.suggestionSub}>{item.parentName}</Text>
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  icon: { fontSize: 16, marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontFamily: 'System',
  },
  clearBtn: { padding: 4 },
  clearText: { color: Colors.textSecondary, fontSize: 13 },
  dropdown: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 220,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionName: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  suggestionSub: { fontSize: 12, color: Colors.textSecondary },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: 12 },
});