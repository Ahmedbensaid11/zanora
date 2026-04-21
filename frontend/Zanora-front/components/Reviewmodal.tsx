import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { ReviewResponse } from '../services/Propertydetailservice';
import StarRating from './Starrating';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingReview: ReviewResponse | null;
  rating: number;
  onRatingChange: (v: number) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  submitting: boolean;
}

const ReviewModal = ({
  visible,
  onClose,
  onSubmit,
  editingReview,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  submitting,
}: ReviewModalProps) => (
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
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>
          {editingReview ? 'Edit Review' : 'Write a Review'}
        </Text>

        <Text style={styles.label}>Your rating</Text>
        <StarRating value={rating} onChange={onRatingChange} size={36} />

        <Text style={[styles.label, { marginTop: 20 }]}>Your comment</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={4}
          placeholder="Share your experience with this property..."
          placeholderTextColor="#AAAAAA"
          value={comment}
          onChangeText={onCommentChange}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{comment.length}/1000</Text>

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
              <Text style={styles.submitText}>
                {editingReview ? 'Update' : 'Submit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

export default ReviewModal;

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
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#AAA',
    textAlign: 'right',
    marginBottom: 20,
  },
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