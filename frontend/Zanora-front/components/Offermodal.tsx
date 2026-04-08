import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/Colors';
import { OfferType } from '../services/Propertydetailservice';

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  offerType: OfferType;
  onOfferTypeChange: (t: OfferType) => void;
  price: string;
  onPriceChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  rentStart: string;
  onRentStartChange: (v: string) => void;
  rentEnd: string;
  onRentEndChange: (v: string) => void;
  submitting: boolean;
  propertyPrice?: number;
}

const OfferModal = ({
  visible,
  onClose,
  onSubmit,
  offerType,
  onOfferTypeChange,
  price,
  onPriceChange,
  message,
  onMessageChange,
  rentStart,
  onRentStartChange,
  rentEnd,
  onRentEndChange,
  submitting,
  propertyPrice,
}: OfferModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.sheet, { paddingBottom: 36 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Make an Offer</Text>

          <Text style={styles.label}>Offer type</Text>
          <View style={styles.typeRow}>
            {([OfferType.RENT, OfferType.BUY] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, offerType === t && styles.typeBtnActive]}
                onPress={() => onOfferTypeChange(t)}
              >
                <MaterialCommunityIcons
                  name={t === OfferType.RENT ? 'key-outline' : 'home-outline'}
                  size={18}
                  color={offerType === t ? '#fff' : Colors.primary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    offerType === t && styles.typeBtnTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Proposed price (TND)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder={`e.g. ${propertyPrice ?? ''}`}
            placeholderTextColor="#AAAAAA"
            value={price}
            onChangeText={onPriceChange}
          />

          {offerType === OfferType.RENT && (
            <>
              <Text style={styles.label}>Rent start date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2025-06-01"
                placeholderTextColor="#AAAAAA"
                value={rentStart}
                onChangeText={onRentStartChange}
              />
              <Text style={styles.label}>Rent end date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-06-01"
                placeholderTextColor="#AAAAAA"
                value={rentEnd}
                onChangeText={onRentEndChange}
              />
            </>
          )}

          <Text style={styles.label}>Message to owner (optional)</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={3}
            placeholder="Introduce yourself or explain your offer..."
            placeholderTextColor="#AAAAAA"
            value={message}
            onChangeText={onMessageChange}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Send Offer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

export default OfferModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  textarea: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  typeBtnTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});