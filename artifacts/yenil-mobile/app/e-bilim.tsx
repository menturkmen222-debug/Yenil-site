import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
  Modal, Alert, Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { PessimisticButton } from "@/components/PessimisticButton";
import { CATEGORIES, LESSONS, type Lesson, type EBilimCategory } from "@/lib/ebilimData";
import {
  watchCompletedLessons,
  watchUnlockedLessons,
  submitQuizAndEarnBP,
  unlockPremiumLesson,
} from "@/lib/firebase";

type ModalPhase = "content" | "quiz" | "result";
const PASS_THRESHOLD = 0.6;

// ── CategoryChip ────────────────────────────────────────────────────
function CategoryChip({
  id, title, emoji, color,
  selected, completedInCat, totalInCat, onPress,
}: {
  id: string; title: string; emoji: string; color: string;
  selected: boolean; completedInCat: number; totalInCat: number;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        chip.base,
        selected
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={chip.emoji}>{emoji}</Text>
      <Text style={[chip.title, { color: selected ? "#fff" : colors.foreground }]}>{title}</Text>
      <View style={[chip.pill, { backgroundColor: selected ? "rgba(255,255,255,0.22)" : color + "20" }]}>
        <Text style={[chip.pillText, { color: selected ? "#fff" : color }]}>
          {completedInCat}/{totalInCat}
        </Text>
      </View>
    </Pressable>
  );
}

// ── LessonCard ──────────────────────────────────────────────────────
function LessonCard({
  lesson, completed, unlocked, cat, onPress,
}: {
  lesson: Lesson; completed: boolean; unlocked: boolean;
  cat: EBilimCategory; onPress: () => void;
}) {
  const colors = useColors();
  const accessible = !lesson.isPremium || unlocked || completed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        lc.card,
        {
          backgroundColor: colors.card,
          borderColor: completed ? cat.color + "50" : colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={cat.gradient as [string, string]}
        style={lc.strip}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      >
        <Text style={lc.stripEmoji}>{lesson.emoji}</Text>
      </LinearGradient>

      <View style={lc.body}>
        <View style={lc.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[lc.title, { color: colors.foreground }]} numberOfLines={2}>
              {lesson.title}
            </Text>
            <Text style={[lc.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {lesson.subtitle}
            </Text>
          </View>

          {completed ? (
            <View style={[lc.badge, { backgroundColor: cat.color + "18", borderColor: cat.color + "35" }]}>
              <Ionicons name="checkmark-circle" size={13} color={cat.color} />
              <Text style={[lc.badgeText, { color: cat.color }]}>Tamam</Text>
            </View>
          ) : lesson.isPremium && !unlocked ? (
            <View style={[lc.badge, { backgroundColor: "#f59e0b18", borderColor: "#f59e0b35" }]}>
              <Ionicons name="lock-closed" size={11} color="#f59e0b" />
              <Text style={[lc.badgeText, { color: "#f59e0b" }]}>{lesson.premiumBPCost} BP</Text>
            </View>
          ) : (
            <View style={[lc.badge, { backgroundColor: "#10b98118", borderColor: "#10b98135" }]}>
              <Ionicons name="gift-outline" size={11} color="#10b981" />
              <Text style={[lc.badgeText, { color: "#10b981" }]}>+{lesson.bpReward} BP</Text>
            </View>
          )}
        </View>

        <View style={lc.bottomRow}>
          <View style={[lc.catPill, { backgroundColor: cat.color + "18" }]}>
            <Text style={[lc.catPillText, { color: cat.color }]}>{cat.emoji} {cat.title}</Text>
          </View>
          <View style={lc.meta}>
            <Ionicons name="time-outline" size={11} color={colors.mutedForeground} />
            <Text style={[lc.metaText, { color: colors.mutedForeground }]}>{lesson.duration}</Text>
            <Ionicons name="help-circle-outline" size={11} color={colors.mutedForeground} />
            <Text style={[lc.metaText, { color: colors.mutedForeground }]}>{lesson.quiz.length} savol</Text>
          </View>
        </View>
      </View>

      <Ionicons
        name={lesson.isPremium && !accessible ? "lock-closed-outline" : "chevron-forward"}
        size={15}
        color={colors.mutedForeground + "70"}
        style={{ alignSelf: "center", marginRight: 14 }}
      />
    </Pressable>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────
export default function EBilimScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deviceId, balance } = useBonusPul();
  const isWeb = Platform.OS === "web";

  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [totalBPEarned, setTotalBPEarned] = useState<number>(0);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [modalPhase, setModalPhase] = useState<ModalPhase>("content");
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [bpAwarded, setBpAwarded] = useState<number>(0);
  const [alreadyClaimed, setAlreadyClaimed] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [unlockLoading, setUnlockLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!deviceId) return;
    const u1 = watchCompletedLessons(deviceId, ids => setCompletedIds(ids));
    const u2 = watchUnlockedLessons(deviceId, ids => setUnlockedIds(ids));
    return () => { u1(); u2(); };
  }, [deviceId]);

  useEffect(() => {
    const earned = completedIds.reduce((sum, id) => {
      const l = LESSONS.find(x => x.id === id);
      return l ? sum + l.bpReward : sum;
    }, 0);
    setTotalBPEarned(Math.round(earned * 100) / 100);
  }, [completedIds]);

  const filteredLessons = selectedCatId === "all"
    ? LESSONS
    : LESSONS.filter(l => l.categoryId === selectedCatId);

  const openLesson = useCallback((lesson: Lesson) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLesson(lesson);
    setModalPhase("content");
    setCurrentQ(0);
    setAnswers(new Array(lesson.quiz.length).fill(null));
    setQuizScore(0);
    setBpAwarded(0);
    setAlreadyClaimed(false);
    setSubmitLoading(false);
    setUnlockLoading(false);
  }, []);

  const closeModal = useCallback(() => setSelectedLesson(null), []);

  const handleUnlock = useCallback(async () => {
    if (!selectedLesson || !deviceId) return;
    const cost = selectedLesson.premiumBPCost ?? 0;
    if (balance < cost) {
      Alert.alert(
        "Ýeterlik BP ýok",
        `Bu sapagy açmak üçin ${cost} BP gerek.\nHäzirki balansynyz: ${balance.toFixed(2)} BP`
      );
      return;
    }
    setUnlockLoading(true);
    const result = await unlockPremiumLesson(deviceId, selectedLesson.id, cost);
    setUnlockLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Ýalňyşlyk", result.message);
    }
  }, [selectedLesson, deviceId, balance]);

  const startQuiz = useCallback(() => {
    if (!selectedLesson) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentQ(0);
    setAnswers(new Array(selectedLesson.quiz.length).fill(null));
    setModalPhase("quiz");
  }, [selectedLesson]);

  const selectAnswer = useCallback((optIdx: number) => {
    Haptics.selectionAsync();
    setAnswers(prev => {
      const next = [...prev];
      next[currentQ] = optIdx;
      return next;
    });
  }, [currentQ]);

  const nextQuestion = useCallback(() => {
    if (!selectedLesson) return;
    if (currentQ < selectedLesson.quiz.length - 1) {
      setCurrentQ(q => q + 1);
    }
  }, [currentQ, selectedLesson]);

  const submitQuiz = useCallback(async () => {
    if (!selectedLesson || !deviceId) return;
    setSubmitLoading(true);
    const correct = selectedLesson.quiz.reduce((sum, q, i) => answers[i] === q.correct ? sum + 1 : sum, 0);
    const score = correct / selectedLesson.quiz.length;
    const passed = score >= PASS_THRESHOLD;
    const res = await submitQuizAndEarnBP(deviceId, selectedLesson.id, passed, selectedLesson.bpReward);
    setQuizScore(score);
    setBpAwarded(res.bpAwarded);
    setAlreadyClaimed(res.alreadyClaimed);
    setSubmitLoading(false);
    setModalPhase("result");
    Haptics.notificationAsync(
      passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
  }, [selectedLesson, deviceId, answers]);

  const cat = selectedLesson
    ? (CATEGORIES.find(c => c.id === selectedLesson.categoryId) ?? CATEGORIES[0])
    : CATEGORIES[0];

  const isPremiumLocked = !!selectedLesson?.isPremium && !unlockedIds.includes(selectedLesson?.id ?? "");
  const isCompleted = completedIds.includes(selectedLesson?.id ?? "");

  return (
    <View style={[sc.root, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <LinearGradient
        colors={["#1e1b4b", "#4338ca", "#6366f1"]}
        style={[sc.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} style={sc.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={sc.headerTitle}>E-Bilim 📚</Text>
          <Text style={sc.headerSub}>O'qi, test ber, BP gazan</Text>
        </View>
        <View style={{ gap: 5, alignItems: "flex-end" }}>
          <View style={sc.statChip}>
            <Ionicons name="checkmark-circle" size={12} color="#22d3ee" />
            <Text style={sc.statChipText}>{completedIds.length} tamam</Text>
          </View>
          <View style={sc.statChip}>
            <Ionicons name="wallet-outline" size={12} color="#22d3ee" />
            <Text style={sc.statChipText}>{totalBPEarned.toFixed(2)} BP</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Category scroll ── */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={sc.catScroll}
          style={{ marginTop: 14 }}
        >
          <CategoryChip
            id="all" title="Ählisi" emoji="🌟" color="#6366f1"
            selected={selectedCatId === "all"}
            onPress={() => { setSelectedCatId("all"); Haptics.selectionAsync(); }}
            completedInCat={completedIds.length}
            totalInCat={LESSONS.length}
          />
          {CATEGORIES.map(c => {
            const inCat = LESSONS.filter(l => l.categoryId === c.id);
            const done = inCat.filter(l => completedIds.includes(l.id)).length;
            return (
              <CategoryChip
                key={c.id}
                id={c.id} title={c.title} emoji={c.emoji} color={c.color}
                selected={selectedCatId === c.id}
                onPress={() => { setSelectedCatId(c.id); Haptics.selectionAsync(); }}
                completedInCat={done}
                totalInCat={inCat.length}
              />
            );
          })}
        </ScrollView>

        {/* ── Learn & Earn promo banner ── */}
        <LinearGradient
          colors={["#064e3b", "#059669"]}
          style={sc.promoBanner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={{ fontSize: 30 }}>🎓</Text>
          <View style={{ flex: 1 }}>
            <Text style={sc.promoTitle}>Learn & Earn</Text>
            <Text style={sc.promoSub}>Bir sabaq = 0.05–0.3 BP + Abraý +1</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={sc.promoCount}>{LESSONS.length}</Text>
            <Text style={sc.promoCountLabel}>sapak</Text>
          </View>
        </LinearGradient>

        {/* ── Section label ── */}
        <Text style={[sc.sectionLabel, { color: colors.mutedForeground }]}>
          {selectedCatId === "all"
            ? "ÄHLI SAPAKLAR"
            : (CATEGORIES.find(c => c.id === selectedCatId)?.title ?? "SAPAKLAR").toUpperCase()}
          {"  "}({filteredLessons.length})
        </Text>

        {/* ── Lessons ── */}
        {filteredLessons.map(lesson => {
          const lessonCat = CATEGORIES.find(c => c.id === lesson.categoryId) ?? CATEGORIES[0];
          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={completedIds.includes(lesson.id)}
              unlocked={unlockedIds.includes(lesson.id)}
              cat={lessonCat}
              onPress={() => openLesson(lesson)}
            />
          );
        })}

      </ScrollView>

      {/* ── Lesson Modal ── */}
      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        {selectedLesson && (
          <View style={[mo.root, { backgroundColor: colors.background }]}>

            {/* Modal header */}
            <LinearGradient
              colors={cat.gradient as [string, string]}
              style={[mo.header, { paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20 }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Pressable onPress={closeModal} style={mo.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={mo.catLabel}>{cat.emoji} {cat.title}</Text>
                <Text style={mo.lessonTitle} numberOfLines={2}>
                  {selectedLesson.emoji} {selectedLesson.title}
                </Text>
              </View>
              {isCompleted && (
                <View style={mo.completedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#fff" />
                  <Text style={mo.completedBadgeText}>Tamam</Text>
                </View>
              )}
            </LinearGradient>

            {/* ── CONTENT PHASE ── */}
            {modalPhase === "content" && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

                {/* Meta chips */}
                <View style={mo.metaRow}>
                  {[
                    { icon: "time-outline", text: selectedLesson.duration },
                    { icon: "help-circle-outline", text: `${selectedLesson.quiz.length} savol` },
                  ].map((m, i) => (
                    <View key={i} style={[mo.metaChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Ionicons name={m.icon as any} size={13} color={cat.color} />
                      <Text style={[mo.metaChipText, { color: cat.color }]}>{m.text}</Text>
                    </View>
                  ))}
                  <View style={[mo.metaChip, { backgroundColor: cat.color + "18", borderColor: cat.color + "30" }]}>
                    <Ionicons name="gift-outline" size={13} color={cat.color} />
                    <Text style={[mo.metaChipText, { color: cat.color }]}>+{selectedLesson.bpReward} BP</Text>
                  </View>
                </View>

                {/* Premium lock */}
                {isPremiumLocked ? (
                  <View style={[mo.premiumCard, { borderColor: "#f59e0b40" }]}>
                    <Ionicons name="lock-closed" size={36} color="#f59e0b" />
                    <Text style={[mo.premiumTitle, { color: colors.foreground }]}>Premium Sapak</Text>
                    <Text style={[mo.premiumSub, { color: colors.mutedForeground }]}>
                      Bu sapagy açmak üçin{" "}
                      <Text style={{ fontWeight: "800", color: "#f59e0b" }}>
                        {selectedLesson.premiumBPCost} BP
                      </Text>
                      {" "}gerek
                    </Text>
                    <View style={[mo.premiumBal, { borderColor: colors.border }]}>
                      <Text style={[mo.premiumBalLabel, { color: colors.mutedForeground }]}>Siziň balansynyz</Text>
                      <Text style={[
                        mo.premiumBalVal,
                        { color: balance >= (selectedLesson.premiumBPCost ?? 0) ? "#059669" : "#ef4444" },
                      ]}>
                        {balance.toFixed(2)} BP
                      </Text>
                    </View>
                    <PessimisticButton
                      onPress={handleUnlock}
                      loading={unlockLoading}
                      disabled={balance < (selectedLesson.premiumBPCost ?? 0)}
                      label={`🔓  ${selectedLesson.premiumBPCost} BP — Açmak`}
                      loadingLabel="Açylýar..."
                      color="#f59e0b"
                      style={{ marginTop: 4 }}
                    />
                    {balance < (selectedLesson.premiumBPCost ?? 0) && (
                      <Pressable
                        onPress={() => { closeModal(); router.push("/agent-topup" as any); }}
                        style={mo.topUpLink}
                      >
                        <Text style={mo.topUpLinkText}>BP goşmak → Agent Deposit</Text>
                        <Ionicons name="arrow-forward" size={12} color="#6366f1" />
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <>
                    {/* Content card */}
                    <View style={[mo.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[mo.contentText, { color: colors.foreground }]}>
                        {selectedLesson.content}
                      </Text>
                    </View>

                    {/* YouTube button */}
                    {selectedLesson.youtubeUrl && (
                      <Pressable
                        onPress={() => Linking.openURL(selectedLesson.youtubeUrl!)}
                        style={({ pressed }) => [mo.ytBtn, { opacity: pressed ? 0.85 : 1 }]}
                      >
                        <Ionicons name="logo-youtube" size={20} color="#fff" />
                        <Text style={mo.ytBtnText}>YouTube'da ko'rish</Text>
                      </Pressable>
                    )}

                    {/* Already completed notice */}
                    {isCompleted && (
                      <View style={[mo.completedNotice, { backgroundColor: cat.color + "12", borderColor: cat.color + "30" }]}>
                        <Ionicons name="checkmark-circle" size={20} color={cat.color} />
                        <View style={{ flex: 1 }}>
                          <Text style={[mo.completedNoticeTitle, { color: cat.color }]}>Sapak tamamlandy!</Text>
                          <Text style={[mo.completedNoticeSub, { color: colors.mutedForeground }]}>
                            BP eýýäm alyndy. Täzeden test berip bilersiňiz (BP berilmez).
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                      <PessimisticButton
                        onPress={startQuiz}
                        label={isCompleted ? "🔁  Testni täzeden ber" : "📝  Testi başla"}
                        color={cat.color}
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            {/* ── QUIZ PHASE ── */}
            {modalPhase === "quiz" && (
              <View style={{ flex: 1 }}>
                {/* Progress */}
                <View style={[mo.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      mo.progressFill,
                      {
                        backgroundColor: cat.color,
                        width: `${((currentQ + 1) / selectedLesson.quiz.length) * 100}%` as any,
                      },
                    ]}
                  />
                </View>
                <Text style={[mo.progressLabel, { color: colors.mutedForeground }]}>
                  {currentQ + 1} / {selectedLesson.quiz.length} savol
                </Text>

                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}>
                  <Text style={[mo.qText, { color: colors.foreground }]}>
                    {selectedLesson.quiz[currentQ].q}
                  </Text>

                  {selectedLesson.quiz[currentQ].options.map((opt, idx) => {
                    const isSelected = answers[currentQ] === idx;
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => selectAnswer(idx)}
                        style={[
                          mo.optBtn,
                          {
                            backgroundColor: isSelected ? cat.color : colors.card,
                            borderColor: isSelected ? cat.color : colors.border,
                          },
                        ]}
                      >
                        <View style={[mo.optCircle, { borderColor: isSelected ? "#fff" : colors.mutedForeground + "50" }]}>
                          {isSelected && <View style={mo.optDot} />}
                        </View>
                        <Text style={[mo.optText, { color: isSelected ? "#fff" : colors.foreground }]}>
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <View style={{ marginTop: 6 }}>
                    {currentQ < selectedLesson.quiz.length - 1 ? (
                      <PessimisticButton
                        onPress={nextQuestion}
                        disabled={answers[currentQ] === null}
                        label="Keyingi →"
                        color={cat.color}
                      />
                    ) : (
                      <PessimisticButton
                        onPress={submitQuiz}
                        loading={submitLoading}
                        disabled={answers[currentQ] === null}
                        label="Natijany gör ✓"
                        loadingLabel="Hisoblanýar..."
                        color={cat.color}
                      />
                    )}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── RESULT PHASE ── */}
            {modalPhase === "result" && (
              <ScrollView contentContainerStyle={{ padding: 24, gap: 16, alignItems: "center" }}>

                {/* Score ring */}
                <View style={[
                  mo.scoreRing,
                  { borderColor: quizScore >= PASS_THRESHOLD ? cat.color : "#ef4444" },
                ]}>
                  <Text style={[mo.scorePercent, { color: quizScore >= PASS_THRESHOLD ? cat.color : "#ef4444" }]}>
                    {Math.round(quizScore * 100)}%
                  </Text>
                  <Text style={[mo.scoreLabel, { color: colors.mutedForeground }]}>
                    {Math.round(quizScore * selectedLesson.quiz.length)}/{selectedLesson.quiz.length} to'g'ri
                  </Text>
                </View>

                {/* Result card */}
                {quizScore >= PASS_THRESHOLD ? (
                  <View style={[mo.resultCard, { backgroundColor: cat.color + "12", borderColor: cat.color + "30" }]}>
                    <Text style={mo.resultEmoji}>🎉</Text>
                    <Text style={[mo.resultTitle, { color: cat.color }]}>Ajoyib natija!</Text>
                    {alreadyClaimed ? (
                      <Text style={[mo.resultSub, { color: colors.mutedForeground }]}>
                        Bu sapak üçin BP eýýäm alyndy.
                      </Text>
                    ) : (
                      <>
                        <View style={mo.bpRow}>
                          <Text style={[mo.bpRowLabel, { color: colors.foreground }]}>Gazanyldy:</Text>
                          <Text style={[mo.bpRowValue, { color: cat.color }]}>+{bpAwarded.toFixed(2)} BP</Text>
                        </View>
                        <Text style={[mo.bpMeta, { color: colors.mutedForeground }]}>
                          Abraý: +1 bal • Balans täzelendi
                        </Text>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={[mo.resultCard, { backgroundColor: "#ef444412", borderColor: "#ef444430" }]}>
                    <Text style={mo.resultEmoji}>💪</Text>
                    <Text style={[mo.resultTitle, { color: "#ef4444" }]}>
                      {Math.round(quizScore * 100)}% — geçme: {PASS_THRESHOLD * 100}%
                    </Text>
                    <Text style={[mo.resultSub, { color: colors.mutedForeground }]}>
                      Sapagy ýene okap, täzeden synanyşyň!
                    </Text>
                  </View>
                )}

                {/* Answer review */}
                <Text style={[mo.reviewLabel, { color: colors.mutedForeground }]}>JOGAPLAR DERŇEWI</Text>
                {selectedLesson.quiz.map((q, qi) => {
                  const ua = answers[qi];
                  const ok = ua === q.correct;
                  return (
                    <View key={qi} style={[mo.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[mo.reviewIcon, { backgroundColor: ok ? "#10b98120" : "#ef444420" }]}>
                        <Ionicons name={ok ? "checkmark" : "close"} size={13} color={ok ? "#10b981" : "#ef4444"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[mo.reviewQ, { color: colors.foreground }]}>{q.q}</Text>
                        <Text style={[mo.reviewCorrect, { color: "#10b981" }]}>✓ {q.options[q.correct]}</Text>
                        {!ok && ua !== null && (
                          <Text style={[mo.reviewUser, { color: "#ef4444" }]}>✗ {q.options[ua]}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}

                <View style={{ gap: 10, width: "100%" }}>
                  {quizScore < PASS_THRESHOLD && (
                    <PessimisticButton
                      onPress={() => {
                        setCurrentQ(0);
                        setAnswers(new Array(selectedLesson.quiz.length).fill(null));
                        setModalPhase("quiz");
                      }}
                      label="🔁  Täzeden synanyşmak"
                      color={cat.color}
                    />
                  )}
                  <Pressable
                    onPress={closeModal}
                    style={[mo.closeCardBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[mo.closeCardBtnText, { color: colors.mutedForeground }]}>Ýap</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}

          </View>
        )}
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const chip = StyleSheet.create({
  base: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  emoji: { fontSize: 15 },
  title: { fontSize: 13, fontWeight: "600" },
  pill: {
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  pillText: { fontSize: 10, fontWeight: "700" },
});

const lc = StyleSheet.create({
  card: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 9,
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  strip: { width: 62, alignItems: "center", justifyContent: "center" },
  stripEmoji: { fontSize: 24 },
  body: { flex: 1, padding: 12, gap: 8 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  subtitle: { fontSize: 11, marginTop: 2 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText: { fontSize: 10, fontWeight: "700" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10 },
});

const sc = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },
  statChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  statChipText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  promoBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16,
    shadowColor: "#059669", shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  promoTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  promoSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3 },
  promoCount: { color: "#fff", fontSize: 26, fontWeight: "900" },
  promoCountLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10, textAlign: "center" },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    marginLeft: 20, marginTop: 20, marginBottom: 10,
  },
});

const mo = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 18,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  catLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" },
  lessonTitle: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: 3 },
  completedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  completedBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  metaRow: { flexDirection: "row", gap: 8, padding: 16 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
  },
  metaChipText: { fontSize: 12, fontWeight: "600" },

  premiumCard: {
    margin: 16, borderRadius: 18, borderWidth: 1,
    padding: 24, gap: 14, alignItems: "center",
  },
  premiumTitle: { fontSize: 20, fontWeight: "800" },
  premiumSub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  premiumBal: {
    flexDirection: "row", justifyContent: "space-between",
    width: "100%", borderTopWidth: 1, paddingTop: 14, marginTop: 4,
  },
  premiumBalLabel: { fontSize: 13 },
  premiumBalVal: { fontSize: 18, fontWeight: "800" },
  topUpLink: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 4,
  },
  topUpLinkText: { color: "#6366f1", fontSize: 13, fontWeight: "600" },

  contentCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, borderWidth: 1, padding: 18,
  },
  contentText: { fontSize: 14, lineHeight: 23 },
  ytBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 12, borderRadius: 14,
    backgroundColor: "#ef4444", height: 50,
  },
  ytBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  completedNotice: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 14,
  },
  completedNoticeTitle: { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  completedNoticeSub: { fontSize: 12, lineHeight: 17 },

  progressTrack: { height: 4, marginHorizontal: 16, borderRadius: 4, marginTop: 16 },
  progressFill: { height: 4, borderRadius: 4 },
  progressLabel: { fontSize: 11, fontWeight: "600", marginLeft: 16, marginTop: 6, marginBottom: 4 },

  qText: { fontSize: 17, fontWeight: "700", lineHeight: 25 },
  optBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, borderWidth: 1.5, padding: 14,
  },
  optCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  optDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  optText: { flex: 1, fontSize: 14, lineHeight: 20 },

  scoreRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 5, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  scorePercent: { fontSize: 36, fontWeight: "900" },
  scoreLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },

  resultCard: {
    width: "100%", borderRadius: 18, borderWidth: 1,
    padding: 20, alignItems: "center", gap: 8,
  },
  resultEmoji: { fontSize: 36 },
  resultTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  resultSub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  bpRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  bpRowLabel: { fontSize: 14, fontWeight: "600" },
  bpRowValue: { fontSize: 24, fontWeight: "900" },
  bpMeta: { fontSize: 11, textAlign: "center" },

  reviewLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    alignSelf: "flex-start",
  },
  reviewCard: {
    width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  reviewIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  reviewQ: { fontSize: 13, fontWeight: "600", marginBottom: 4, lineHeight: 18 },
  reviewCorrect: { fontSize: 12, fontWeight: "600" },
  reviewUser: { fontSize: 12, marginTop: 2 },

  closeCardBtn: {
    borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: "center",
  },
  closeCardBtnText: { fontSize: 14, fontWeight: "600" },
});
