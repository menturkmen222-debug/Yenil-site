import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, Alert, Platform, Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type Category = "all" | "railway" | "finance" | "tech" | "language";

const CATEGORIES: { id: Category; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: "all", label: "Ählisi", icon: "apps-outline", color: "#6366f1" },
  { id: "railway", label: "Demirýol", icon: "train-outline", color: "#10b981" },
  { id: "finance", label: "Maliýe", icon: "cash-outline", color: "#f59e0b" },
  { id: "tech", label: "Tehnologiýa", icon: "laptop-outline", color: "#0ea5e9" },
  { id: "language", label: "Dil öwren", icon: "language-outline", color: "#8b5cf6" },
];

const BOOKS = [
  {
    id: 1,
    category: "railway" as Category,
    title: "Demirýol bilet gollanmasy",
    author: "Ýeňil Team",
    pages: 24,
    desc: "Türkmenistanda demirýol bilet satyn almagyň ähli usullary we maslahatlary.",
    icon: "train-outline" as const,
    color: "#10b981",
    free: true,
    tags: ["Demirýol", "Bilet", "Gollanma"],
    content: `# Demirýol Bilet Gollanmasy\n\n## Bilet almagyň usullary\n\n**1. Onlayn usul (Ýeňil arkaly)**\nÝeňil programmasy arkaly, kart tölegsiz bilet almak mümkin.\n\n**2. Kassadan**\nDemirýol menziliniň kassasyndan göni bilet alyp bolýar.\n\n## Möhüm maglumatlary\n- Pasport talap edilýär\n- Sapar senesi 1–90 gün öňünden bolmaly\n- Bilet bahasy 60–80 TMT aralygynda\n\n## Ýeňil arkaly sargyt ediş ädimi\n1. Programmany açyň\n2. "Demirýol" bölümine giriň\n3. Şahsy maglumatlaryňyzy dolduryň\n4. Tölegi geçiriň\n5. 1–4 sagadyň içinde SMS alarsyňyz`,
  },
  {
    id: 2,
    category: "finance" as Category,
    title: "Bonus Pul nähili işleýär?",
    author: "Ýeňil Maliýe",
    pages: 18,
    desc: "Bonus pul (BP) nähili gazanylýar, harçlanýar we näme üçin peýdalydyr.",
    icon: "wallet-outline" as const,
    color: "#f59e0b",
    free: true,
    tags: ["Bonus", "Pul", "Maliýe"],
    content: `# Bonus Pul Gollanmasy\n\n## Bonus pul (BP) näme?\nBonus pul — Ýeňil platformasynda ulanylýan ýörite balans.\n\n## Nähili gazanylýar?\n- Her sargytda 2% geri gelýär\n- Dostlaryňy çagyrsaň 50 BP\n- Ýörite teklipler arkaly\n\n## Nirde ulanyp bolýar?\n- Demirýol bilet tölegleri\n- Walýuta çalyşmak\n- Ähli Ýeňil hyzmatlary\n\n## Möhüm bellikler\n- BP nagtlaşdyrylyp bilinmeýär\n- Möhleti — 12 aý\n- 1 BP = 1 TMT bahasy bar`,
  },
  {
    id: 3,
    category: "finance" as Category,
    title: "Walýuta çalyşmak",
    author: "Ýeňil Finance",
    pages: 32,
    desc: "Payeer, Perfect Money we WebMoney walýutalary TMT çalyşmagyň gollanmasy.",
    icon: "swap-horizontal-outline" as const,
    color: "#6366f1",
    free: false,
    tags: ["Walýuta", "Payeer", "Exchange"],
    content: `# Walýuta Çalyşmak Gollanmasy\n\n## Elýeterli walýutalar\n- Payeer (P)\n- Perfect Money (PM)\n- WebMoney (WMZ)\n\n## Alyş nyrhy\n1 USD = 29 TMT\n\n## Satyş nyrhy\n1 USD = 19 TMT\n\n## Çalyşmak ädimi\n1. TMCell tab-a giriň\n2. Mukdary giriziň\n3. Walýuta hasabyňyzy görkeziň\n4. Tölegi geçiriň\n5. 30 minut içinde tamamlanar`,
  },
  {
    id: 4,
    category: "tech" as Category,
    title: "Türkmenistanda Internet",
    author: "TM Tech",
    pages: 45,
    desc: "Türkmenistanda internet, TMCell we onlayn hyzmatlaryň doly gollanmasy.",
    icon: "wifi-outline" as const,
    color: "#0ea5e9",
    free: true,
    tags: ["Internet", "TMCell", "Tech"],
    content: `# Türkmenistanda Internet Gollanmasy\n\n## Esasy operatorlar\n- **TMCell** — ýurt içi baş operator\n- **Altyn Asyr** — internet hyzmatlar\n\n## Internet paketleri\nTMCell-iň internet paketleri:\n- 5 GB — 25 TMT/aý\n- 10 GB — 45 TMT/aý\n- Çäksiz — 80 TMT/aý\n\n## Maslahatlar\n- WiFi-dan mümkin boldugyça peýdalan\n- VPN ulanmak maslahat berilýär\n- Ýüklemeler gije geçiril`,
  },
  {
    id: 5,
    category: "language" as Category,
    title: "Iňlis dili esaslary",
    author: "English for TM",
    pages: 120,
    desc: "Türkmen dilinden iňlis diline başlamak üçin iň esasy sözler we düzgünler.",
    icon: "language-outline" as const,
    color: "#8b5cf6",
    free: false,
    tags: ["Iňlisçe", "Dil", "Öwreniş"],
    content: `# Iňlis Dili Esaslary\n\n## Gündelik sözler\n- Salam — Hello\n- Hoş gal — Goodbye\n- Sagbol — Thank you\n- Ýok — No\n- Hawa — Yes\n\n## Sanlar\n1 — One, 2 — Two, 3 — Three\n4 — Four, 5 — Five\n\n## Esasy soraglar\n- What is your name? — Adyňyz näme?\n- How are you? — Nähili ýagdaý?`,
  },
  {
    id: 6,
    category: "railway" as Category,
    title: "Aşgabat demirýol menzili",
    author: "DY Info",
    pages: 15,
    desc: "Aşgabat demirýol menziliniň doly ýol görkezijisi we zal maglumatlary.",
    icon: "map-outline" as const,
    color: "#ef4444",
    free: true,
    tags: ["Aşgabat", "Menzil", "Ýol"],
    content: `# Aşgabat Demirýol Menzili\n\n## Menziliň ýerleşişi\nAşgabat, Garaşsyzlyk şaýoly\n\n## Işleýiş wagty\n- Kassa: 08:00 – 20:00\n- Zal: 24 sagat açyk\n\n## Hyzmatlar\n- Bagaž saklamak\n- Kafe we naharhanalar\n- Dermanlar we dükançyklar\n\n## Ugurlar\n- Aşgabat → Daşoguz (gün aşyr)\n- Aşgabat → Mary (her gün)\n- Aşgabat → Balkanabat (hepde 3 gezek)`,
  },
];

export default function EkitapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<(typeof BOOKS)[0] | null>(null);

  const filtered = BOOKS.filter((b) => {
    const matchCat = selectedCategory === "all" || b.category === selectedCategory;
    const matchSearch =
      searchQuery === "" ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  function openBook(book: (typeof BOOKS)[0]) {
    if (!book.free) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Premium kitap",
        "Bu kitap tölegli. Ähli premium kitaplara elýeterlilik üçin obuna alyň.",
        [
          { text: "Ýap" },
          { text: "Obuna al", onPress: () => router.push("/(tabs)/more" as any) },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedBook(book);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (isWeb ? 0 : insets.top) + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color="#fff" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>E-kitap & Gollanmalar</Text>
          <Text style={styles.headerSub}>{BOOKS.length} kitap elýeterli</Text>
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Kitap gözle..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedCategory(cat.id); }}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === cat.id ? cat.color : colors.card,
                borderColor: selectedCategory === cat.id ? cat.color : colors.border,
              },
            ]}
          >
            <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.id ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.categoryChipText, { color: selectedCategory === cat.id ? "#fff" : colors.mutedForeground }]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Kitap tapylmady</Text>
          </View>
        )}
        <View style={styles.booksGrid}>
          {filtered.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => openBook(book)}
              style={({ pressed }) => [
                styles.bookCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.bookCover, { backgroundColor: book.color + "20" }]}>
                <Ionicons name={book.icon} size={32} color={book.color} />
                {!book.free && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="lock-closed" size={10} color="#fff" />
                    <Text style={styles.premiumBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={styles.bookInfo}>
                <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]}>{book.author}</Text>
                <View style={styles.bookMeta}>
                  <Ionicons name="document-text-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.bookMetaText, { color: colors.mutedForeground }]}>{book.pages} sahypa</Text>
                </View>
                <View style={[styles.freeBadge, { backgroundColor: book.free ? "#10b98120" : "#f59e0b20" }]}>
                  <Text style={[styles.freeBadgeText, { color: book.free ? "#10b981" : "#f59e0b" }]}>
                    {book.free ? "Mugt" : "Premium"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Book Reader Modal */}
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBook(null)}
      >
        {selectedBook && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {selectedBook.title}
                </Text>
                <Text style={[styles.modalAuthor, { color: colors.mutedForeground }]}>{selectedBook.author}</Text>
              </View>
              <Pressable
                onPress={() => setSelectedBook(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.muted }]}
              >
                <Ionicons name="close-outline" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.bookCoverBig, { backgroundColor: selectedBook.color + "20" }]}>
                <Ionicons name={selectedBook.icon} size={56} color={selectedBook.color} />
                <Text style={[styles.bookCoverBigTitle, { color: selectedBook.color }]}>
                  {selectedBook.title}
                </Text>
              </View>
              {selectedBook.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return <Text key={i} style={[styles.h1, { color: colors.foreground }]}>{line.slice(2)}</Text>;
                } else if (line.startsWith("## ")) {
                  return <Text key={i} style={[styles.h2, { color: colors.foreground }]}>{line.slice(3)}</Text>;
                } else if (line.startsWith("**") && line.endsWith("**")) {
                  return <Text key={i} style={[styles.bold, { color: colors.foreground }]}>{line.slice(2, -2)}</Text>;
                } else if (line.startsWith("- ")) {
                  return (
                    <View key={i} style={styles.listItem}>
                      <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                      <Text style={[styles.listText, { color: colors.mutedForeground }]}>{line.slice(2)}</Text>
                    </View>
                  );
                } else if (line.trim() === "") {
                  return <View key={i} style={{ height: 8 }} />;
                } else {
                  return <Text key={i} style={[styles.bodyText, { color: colors.mutedForeground }]}>{line}</Text>;
                }
              })}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  categoriesScroll: { marginBottom: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "600" },
  booksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  bookCard: { width: "47%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  bookCover: { height: 100, alignItems: "center", justifyContent: "center" },
  premiumBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f59e0b", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  premiumBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  bookInfo: { padding: 12, gap: 4 },
  bookTitle: { fontSize: 13, fontWeight: "700", lineHeight: 17 },
  bookAuthor: { fontSize: 11 },
  bookMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  bookMetaText: { fontSize: 11 },
  freeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start", marginTop: 2 },
  freeBadgeText: { fontSize: 10, fontWeight: "700" },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalAuthor: { fontSize: 13, marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bookCoverBig: { borderRadius: 20, padding: 32, alignItems: "center", gap: 12, marginBottom: 24 },
  bookCoverBigTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  h1: { fontSize: 22, fontWeight: "800", marginBottom: 12, marginTop: 8 },
  h2: { fontSize: 17, fontWeight: "700", marginBottom: 8, marginTop: 16 },
  bold: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  listItem: { flexDirection: "row", gap: 8, marginBottom: 4 },
  bullet: { fontSize: 16, lineHeight: 22 },
  listText: { flex: 1, fontSize: 14, lineHeight: 22 },
  bodyText: { fontSize: 14, lineHeight: 22, marginBottom: 2 },
});
