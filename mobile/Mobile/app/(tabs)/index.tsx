import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";

const { width, height } = Dimensions.get("window");

// Animated fade+slide component
function FadeSlide({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Pulsing glow dot
function GlowOrb({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style?: object;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          position: "absolute",
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}

// Service card component
function ServiceCard({
  title,
  subtitle,
  description,
  delay,
}: {
  title: string;
  subtitle: string;
  description: string;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <FadeSlide delay={delay}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.serviceCard}
        >
          {/* Red glow accent top-right */}
          <View style={styles.serviceGlow} />

          {/* Icon circle */}
          <View style={styles.serviceIconCircle}>
            <View style={styles.serviceIconDot} />
          </View>

          <Text style={styles.serviceTitle}>{title}</Text>
          <Text style={styles.serviceSubtitle}>{subtitle}</Text>
          <Text style={styles.serviceDesc}>{description}</Text>

          {/* Bottom bar accent */}
          <View style={styles.serviceBottomBar} />
        </TouchableOpacity>
      </Animated.View>
    </FadeSlide>
  );
}

// Review card
function ReviewCard({
  name,
  role,
  comment,
  delay,
}: {
  name: string;
  role: string;
  comment: string;
  delay: number;
}) {
  return (
    <FadeSlide delay={delay}>
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>{name[0]}</Text>
          </View>
          <View>
            <Text style={styles.reviewName}>{name}</Text>
            <Text style={styles.reviewRole}>{role}</Text>
          </View>
          <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={styles.reviewStar}>★</Text>
            ))}
          </View>
        </View>
        <Text style={styles.reviewComment}>"{comment}"</Text>
      </View>
    </FadeSlide>
  );
}

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeService, setActiveService] = useState(0);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Sticky Nav */}
      <Animated.View style={[styles.navbar, { opacity: headerOpacity }]}>
        <Image
          source={require("../../assets/images/otokwikklogo.png")}
          style={styles.navLogo}
          resizeMode="contain"
        />
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.navBookBtn}>
            <Text style={styles.navBookText}>BOOK</Text>
          </TouchableOpacity>
        </Link>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ─── HERO ─── */}
        <View style={styles.hero}>
          {/* Background glow orbs */}
          <GlowOrb
            color="rgba(220,38,38,0.12)"
            size={300}
            style={{ top: -50, left: -80 }}
          />
          <GlowOrb
            color="rgba(37,99,235,0.08)"
            size={250}
            style={{ bottom: 20, right: -60 }}
          />

          {/* Background image overlay */}
          <Image
            source={require("../../assets/images/otosaranay.png")}
            style={styles.heroBg}
            resizeMode="cover"
          />
          <View style={styles.heroBgOverlay} />

          {/* Content */}
          <View style={styles.heroContent}>
            <FadeSlide delay={0}>
              <View style={styles.logoBadge}>
                <Image
                  source={require("../../assets/images/otokwikklogo.png")}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
              </View>
            </FadeSlide>

            <FadeSlide delay={200}>
              <Text style={styles.heroTitle}>PRECISION</Text>
              <Text style={[styles.heroTitle, styles.heroTitleRed]}>
                DETAILING
              </Text>
            </FadeSlide>

            <FadeSlide delay={400}>
              <Text style={styles.heroSubtitle}>
                Experience the Art of{"\n"}Automotive Perfection
              </Text>
            </FadeSlide>

            <FadeSlide delay={600}>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity style={styles.heroCTA} activeOpacity={0.85}>
                  <Text style={styles.heroCTAText}>BOOK YOUR EXPERIENCE</Text>
                  <Text style={styles.heroCTAArrow}>→</Text>
                </TouchableOpacity>
              </Link>
            </FadeSlide>
          </View>

          {/* Scroll hint */}
          <View style={styles.scrollHint}>
            <View style={styles.scrollHintLine} />
            <Text style={styles.scrollHintText}>SCROLL</Text>
          </View>
        </View>

        {/* ─── SERVICES ─── */}
        <View style={styles.section}>
          <FadeSlide>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our Services</Text>
              <View style={styles.sectionDivider} />
            </View>
          </FadeSlide>

          <ServiceCard
            title="EXTERIOR"
            subtitle="Showroom Shine"
            description="Multi-stage washing process, clay bar treatment, and machine polishing for a mirror-like finish."
            delay={100}
          />
          <ServiceCard
            title="INTERIOR"
            subtitle="Pure Luxury"
            description="Steam cleaning, leather conditioning, and deep extraction for a sterile, fresh-from-factory interior."
            delay={200}
          />
          <ServiceCard
            title="PROTECTION"
            subtitle="Ultima Guard"
            description="Grade-A Ceramic coatings and PPF applications providing 9H hardness and hydrophobic properties."
            delay={300}
          />
        </View>

        {/* ─── STATS BAND ─── */}
        <FadeSlide>
          <View style={styles.statsBand}>
            <View style={styles.statsBandGlow} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>CLIENTS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5.0</Text>
                <Text style={styles.statLabel}>RATING</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>15+</Text>
                <Text style={styles.statLabel}>YEARS</Text>
              </View>
            </View>
          </View>
        </FadeSlide>

        {/* ─── WHY CHOOSE US ─── */}
        <View style={styles.section}>
          <FadeSlide>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Why Choose</Text>
              <Text style={[styles.sectionTitle, { color: "#dc2626" }]}>
                Otokwikk?
              </Text>
              <View style={styles.sectionDivider} />
            </View>
          </FadeSlide>

          {[
            {
              title: "Expert Technicians",
              desc: "Highly trained professionals with years of experience",
            },
            {
              title: "Premium Products",
              desc: "We use only the finest automotive care products",
            },
            {
              title: "Satisfaction Guaranteed",
              desc: "Your complete satisfaction is our top priority",
            },
          ].map((item, i) => (
            <FadeSlide key={i} delay={i * 100}>
              <View style={styles.whyItem}>
                <View style={styles.whyCheck}>
                  <Text style={styles.whyCheckText}>✓</Text>
                </View>
                <View style={styles.whyTextWrap}>
                  <Text style={styles.whyTitle}>{item.title}</Text>
                  <Text style={styles.whyDesc}>{item.desc}</Text>
                </View>
              </View>
            </FadeSlide>
          ))}

          <FadeSlide delay={400}>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity style={styles.whyCTA} activeOpacity={0.85}>
                <Text style={styles.whyCTAText}>BOOK YOUR SESSION</Text>
              </TouchableOpacity>
            </Link>
          </FadeSlide>
        </View>

        {/* ─── LOCATION ─── */}
        <View style={[styles.section, styles.locationSection]}>
          <FadeSlide>
            <Text style={styles.sectionTitle}>
              VISIT US AT{" "}
              <Text style={{ color: "#dc2626" }}>SARANAY</Text>
            </Text>
            <View style={styles.sectionDivider} />
          </FadeSlide>

          <FadeSlide delay={100}>
            <View style={styles.locationCard}>
              {[
                {
                  icon: "📍",
                  label: "Our Location",
                  value:
                    "Lot 1 Block 1, Camarin Road,\nNorth Caloocan, Metro Manila",
                },
                {
                  icon: "🕐",
                  label: "Operating Hours",
                  value: "Mon – Sun: 8:00 AM – 7:00 PM",
                },
                {
                  icon: "📞",
                  label: "Contact Us",
                  value: "+63 9XX XXX XXXX\ninfo@otokwikk.com",
                },
              ].map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.locationRow,
                    i < 2 && styles.locationRowBorder,
                  ]}
                >
                  <View style={styles.locationIcon}>
                    <Text style={styles.locationEmoji}>{item.icon}</Text>
                  </View>
                  <View style={styles.locationTextWrap}>
                    <Text style={styles.locationLabel}>{item.label}</Text>
                    <Text style={styles.locationValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeSlide>

          <FadeSlide delay={200}>
            <TouchableOpacity style={styles.directionBtn} activeOpacity={0.85}>
              <Text style={styles.directionBtnText}>GET DIRECTIONS →</Text>
            </TouchableOpacity>
          </FadeSlide>
        </View>

        {/* ─── REVIEWS ─── */}
        <View style={styles.section}>
          <FadeSlide>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>
                WHAT OUR{" "}
                <Text style={{ color: "#dc2626" }}>CLIENTS</Text> SAY
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text key={s} style={styles.headerStar}>★</Text>
                ))}
              </View>
              <Text style={styles.certifiedText}>
                CERTIFIED 5.0 RATED DETAILING SERVICE
              </Text>
              <View style={styles.sectionDivider} />
            </View>
          </FadeSlide>

          <ReviewCard
            name="Lorenzo M."
            role="Superbike Enthusiast"
            comment="The precision they show is unmatched. My bike looks even better than the day I bought it."
            delay={100}
          />
          <ReviewCard
            name="Maria K."
            role="SUV Owner"
            comment="Professional staff and premium products. The ceramic coating they applied is purely magical."
            delay={200}
          />
          <ReviewCard
            name="Paolo D."
            role="Luxury Sedan Owner"
            comment="Attention to detail is their signature. Otokwikk truly understands automotive art."
            delay={300}
          />
        </View>

        {/* ─── FOOTER CTA ─── */}
        <FadeSlide>
          <View style={styles.footerCTA}>
            <GlowOrb
              color="rgba(220,38,38,0.15)"
              size={200}
              style={{ top: -40, left: -40 }}
            />
            <Text style={styles.footerCTATitle}>Ready to Shine?</Text>
            <Text style={styles.footerCTASub}>
              Book your premium detailing session today
            </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity
                style={styles.footerCTABtn}
                activeOpacity={0.85}
              >
                <Text style={styles.footerCTABtnText}>BOOK NOW →</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </FadeSlide>

        {/* ─── FOOTER ─── */}
        <View style={styles.footer}>
          <Image
            source={require("../../assets/images/otokwikklogo.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerTagline}>
            Redefining automotive care with precision detailing and showroom
            excellence across Metro Manila.
          </Text>

          {/* Social links */}
          <View style={styles.socialRow}>
            {["f", "𝕏", "ig"].map((s, i) => (
              <View key={i} style={styles.socialBtn}>
                <Text style={styles.socialBtnText}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footerLinks}>
            {["Services", "Gallery", "Contact", "Privacy Policy"].map(
              (l, i) => (
                <Text key={i} style={styles.footerLink}>
                  {l}
                </Text>
              )
            )}
          </View>

          <Text style={styles.footerCopy}>
            © 2026 <Text style={{ color: "#fff" }}>Otokwikk</Text>. All rights
            reserved.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scroll: {
    flex: 1,
  },

  // ── NAVBAR ──
  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  navLogo: {
    width: 100,
    height: 32,
  },
  navBookBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navBookText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 2,
  },

  // ── HERO ──
  hero: {
    height: height,
    backgroundColor: "#000",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.35,
  },
  heroBgOverlay: {
    position: "absolute",
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroLogo: {
    width: 160,
    height: 56,
  },
  heroTitle: {
    fontSize: 64,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -2,
    lineHeight: 64,
  },
  heroTitleRed: {
    color: "#dc2626",
    marginBottom: 20,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 36,
    lineHeight: 22,
  },
  heroCTA: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 50,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  heroCTAText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  heroCTAArrow: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  scrollHint: {
    position: "absolute",
    bottom: 32,
    alignItems: "center",
    gap: 6,
  },
  scrollHintLine: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  scrollHintText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: 3,
  },

  // ── SECTIONS ──
  section: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#000",
  },
  sectionHeader: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  sectionDivider: {
    width: 48,
    height: 3,
    backgroundColor: "#dc2626",
    borderRadius: 2,
    marginTop: 12,
  },

  // ── SERVICE CARDS ──
  serviceCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    position: "relative",
  },
  serviceGlow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  serviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(220,38,38,0.15)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  serviceIconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#dc2626",
  },
  serviceTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  serviceSubtitle: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  serviceDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    lineHeight: 22,
  },
  serviceBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 0,
    height: 2,
    backgroundColor: "#dc2626",
    borderRadius: 1,
  },

  // ── STATS ──
  statsBand: {
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(220,38,38,0.15)",
    paddingVertical: 28,
    overflow: "hidden",
    position: "relative",
  },
  statsBandGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 300,
    height: 60,
    marginLeft: -150,
    marginTop: -30,
    backgroundColor: "rgba(220,38,38,0.05)",
    borderRadius: 30,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: "#dc2626",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  statLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // ── WHY CHOOSE ──
  whyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  whyCheck: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  whyCheckText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  whyTextWrap: {
    flex: 1,
    paddingTop: 4,
  },
  whyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  whyDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    lineHeight: 20,
  },
  whyCTA: {
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  whyCTAText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.5,
  },

  // ── LOCATION ──
  locationSection: {
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  locationCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    gap: 14,
  },
  locationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(220,38,38,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locationEmoji: {
    fontSize: 18,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  locationValue: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    lineHeight: 20,
  },
  directionBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  directionBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.5,
  },

  // ── REVIEWS ──
  reviewsHeader: {
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  headerStar: {
    color: "#dc2626",
    fontSize: 18,
  },
  certifiedText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: "700",
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  reviewAvatarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
  },
  reviewName: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  reviewRole: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewStars: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  reviewStar: {
    color: "#dc2626",
    fontSize: 12,
  },
  reviewComment: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },

  // ── FOOTER CTA ──
  footerCTA: {
    backgroundColor: "#0f0f0f",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 24,
    paddingVertical: 52,
    alignItems: "center",
    overflow: "hidden",
  },
  footerCTATitle: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: 8,
  },
  footerCTASub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  footerCTABtn: {
    borderWidth: 2,
    borderColor: "#dc2626",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
  },
  footerCTABtnText: {
    color: "#dc2626",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.5,
  },

  // ── FOOTER ──
  footer: {
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
    alignItems: "center",
  },
  footerLogo: {
    width: 120,
    height: 40,
    marginBottom: 16,
  },
  footerTagline: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  socialBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 24,
  },
  footerLink: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
  },
  footerCopy: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
  },
});