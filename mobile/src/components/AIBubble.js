import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius } from '../theme/colors';

export default function AIBubble() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Namaste! I'm Shubham AI. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isOpen, loading]);

  if (!user) return null;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const { data } = await API.post('/ai/chat', {
        message: userMessage,
        history: messages.slice(-10),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting. Please try again!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIsOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHead}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.avatarWrap}>
                  <MaterialCommunityIcons name="head-circuit-outline" size={28} color={colors.primaryLight} />
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Shubham AI</Text>
                  <Text style={styles.sheetSub}>Always here to help</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} hitSlop={12}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.msgScroll}
              contentContainerStyle={{ paddingVertical: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[styles.msgRow, msg.role === 'user' ? styles.msgUser : styles.msgAsst]}
                >
                  <View
                    style={[
                      styles.bubble,
                      msg.role === 'user' ? styles.bubbleUser : styles.bubbleAsst,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.role === 'user' && { color: '#fff' },
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={styles.msgRow}>
                  <View style={[styles.bubble, styles.bubbleAsst, styles.typing]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                maxLength={500}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
              >
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 8) + 58 }]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.9}
      >
        <Feather name={isOpen ? 'x' : 'message-circle'} size={26} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    zIndex: 50,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  sheetSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  msgScroll: { maxHeight: 360, paddingHorizontal: 16 },
  msgRow: { marginBottom: 10, flexDirection: 'row' },
  msgUser: { justifyContent: 'flex-end' },
  msgAsst: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: colors.primary },
  bubbleAsst: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  typing: { minWidth: 60, alignItems: 'center' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
