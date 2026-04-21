import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/Colors';
import { ReviewResponse } from '../services/Propertydetailservice';
import StarRating from './Starrating';

// ─── SOAP Service ────────────────────────────────────────────────────────────

interface SatisfactionResult {
  satisfactionScore: number;
  satisfactionLabel: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | string;
  confidence: number;
  explanation: string;
  status: string;
}

async function fetchSatisfaction(
  reviewText: string,
  starsGiven: number,
): Promise<SatisfactionResult | null> {
  const soapBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:tns="http://soap.satisfaction.com/">
      <soapenv:Header/>
      <soapenv:Body>
        <tns:predictSatisfaction>
          <satisfactionRequest>
            <reviewText>${reviewText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</reviewText>
            <starsGiven>${starsGiven}</starsGiven>
          </satisfactionRequest>
        </tns:predictSatisfaction>
      </soapenv:Body>
    </soapenv:Envelope>
  `.trim();

  try {
    const res = await fetch('http://192.168.0.109:8084/soap/satisfaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: '',
      },
      body: soapBody,
    });

    if (!res.ok) return null;
    const xml = await res.text();

    const get = (tag: string) => {
      const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };

    return {
      satisfactionScore: parseFloat(get('satisfactionScore')) || 0,
      satisfactionLabel: get('satisfactionLabel'),
      confidence: parseFloat(get('confidence')) || 0,
      explanation: get('explanation'),
      status: get('status'),
    };
  } catch {
    return null;
  }
}

// ─── Sentiment Badge ──────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  POSITIVE: { icon: 'emoticon-happy-outline', color: '#1A9E5C', bg: '#E6F9F1', label: 'Positive' },
  NEUTRAL:  { icon: 'emoticon-neutral-outline', color: '#D08A00', bg: '#FFF8E1', label: 'Neutral' },
  NEGATIVE: { icon: 'emoticon-sad-outline',    color: '#C0392B', bg: '#FDECEC', label: 'Negative' },
};

interface SentimentBadgeProps {
  result: SatisfactionResult;
}

const SentimentBadge = ({ result }: SentimentBadgeProps) => {
  const cfg = SENTIMENT_CONFIG[result.satisfactionLabel] ?? {
    icon: 'help-circle-outline',
    color: Colors.textSecondary,
    bg: Colors.border,
    label: result.satisfactionLabel,
  };

  return (
    <View style={[styles.sentimentBox, { backgroundColor: cfg.bg }]}>
      {/* Row: icon + label + score + confidence */}
      <View style={styles.sentimentHeader}>
        <View style={styles.sentimentLeft}>
          <MaterialCommunityIcons name={cfg.icon} size={15} color={cfg.color} />
          <Text style={[styles.sentimentLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={styles.sentimentRight}>
          <Text style={[styles.sentimentScore, { color: cfg.color }]}>
            {result.satisfactionScore.toFixed(1)}/5
          </Text>
          <View style={[styles.confidencePill, { borderColor: cfg.color + '44' }]}>
            <Text style={[styles.confidenceText, { color: cfg.color }]}>
              {result.confidence.toFixed(0)}% confidence
            </Text>
          </View>
        </View>
      </View>

      {/* Explanation */}
      <Text style={[styles.sentimentExplanation, { color: cfg.color }]}>
        {result.explanation}
      </Text>
    </View>
  );
};

// ─── ReviewCard ───────────────────────────────────────────────────────────────

interface ReviewCardProps {
  review: ReviewResponse;
  isOwnReview: boolean;
  onEdit: (r: ReviewResponse) => void;
  onDelete: (id: string) => void;
}

const ReviewCard = ({ review, isOwnReview, onEdit, onDelete }: ReviewCardProps) => {
  const [sentiment, setSentiment] = useState<SatisfactionResult | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingSentiment(true);
    fetchSatisfaction(review.comment, review.rating).then((result) => {
      if (!cancelled) {
        setSentiment(result);
        setLoadingSentiment(false);
      }
    });
    return () => { cancelled = true; };
  }, [review.comment, review.rating]);

  const date = new Date(review.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const avatarUri = review.profileImg
    ? `data:image/jpeg;base64,${review.profileImg}`
    : null;

  return (
    <View style={styles.card}>
      {/* Edit / Delete for own review */}
      {isOwnReview && (
        <View style={styles.ownActions}>
          <TouchableOpacity
            style={styles.ownActionBtn}
            onPress={() => onEdit(review)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={styles.ownActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ownActionBtn, styles.deleteBtn]}
            onPress={() => onDelete(review.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={15} color="#E74C3C" />
            <Text style={[styles.ownActionText, { color: '#E74C3C' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header: avatar + name + stars */}
      <View style={styles.cardHeader}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(review.username ?? String(review.userId)).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.userName}>
              {review.username ?? `User #${review.userId}`}
            </Text>
            {isOwnReview && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            )}
            {review.edited && (
              <Text style={styles.editedBadge}>edited</Text>
            )}
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        <StarRating value={review.rating} size={14} readonly />
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Sentiment Analysis */}
      <View style={styles.sentimentWrapper}>
        {loadingSentiment ? (
          <View style={styles.sentimentLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.sentimentLoadingText}>Analysing review…</Text>
          </View>
        ) : sentiment && sentiment.status === 'SUCCESS' ? (
          <SentimentBadge result={sentiment} />
        ) : null}
      </View>
    </View>
  );
};

export default ReviewCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  ownActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  ownActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}12`,
  },
  deleteBtn: { backgroundColor: '#FDECEC' },
  ownActionText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  avatarText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  userName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  youBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  editedBadge: {
    fontSize: 10,
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  date: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  comment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // ── Sentiment ──
  sentimentWrapper: {
    marginTop: 10,
  },
  sentimentLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  sentimentLoadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sentimentBox: {
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  sentimentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sentimentLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sentimentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sentimentScore: {
    fontSize: 12,
    fontWeight: '700',
  },
  confidencePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sentimentExplanation: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.85,
  },
});