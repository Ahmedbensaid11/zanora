import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

const StarRating = ({ value, onChange, size = 28, readonly = false }: StarRatingProps) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => !readonly && onChange?.(star)}
        disabled={readonly}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={value >= star ? 'star' : 'star-outline'}
          size={size}
          color={value >= star ? '#F4B942' : '#D0D0D0'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default StarRating;